package com.example.Openfest.service;

import com.example.Openfest.dto.TicketResponse;
import com.example.Openfest.entity.Event;
import com.example.Openfest.entity.EventStatus;
import com.example.Openfest.entity.Rsvp;
import com.example.Openfest.entity.Ticket;
import com.example.Openfest.entity.TicketStatus;
import com.example.Openfest.entity.User;
import com.example.Openfest.repository.EventRepository;
import com.example.Openfest.repository.RsvpRepository;
import com.example.Openfest.repository.TicketRepository;
import com.example.Openfest.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.security.SecureRandom;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class TicketService {

    private static final String CODE_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
    private static final int SEGMENT_LENGTH = 4;
    private static final int MAX_GENERATION_ATTEMPTS = 10;

    private final TicketRepository ticketRepository;
    private final EventRepository eventRepository;
    private final UserRepository userRepository;
    private RsvpRepository rsvpRepository;
    private final SecureRandom secureRandom = new SecureRandom();

    public TicketService(TicketRepository ticketRepository,
                         EventRepository eventRepository,
                         UserRepository userRepository) {
        this.ticketRepository = ticketRepository;
        this.eventRepository = eventRepository;
        this.userRepository = userRepository;
    }

    @Autowired(required = false)
    public void setRsvpRepository(RsvpRepository rsvpRepository) {
        this.rsvpRepository = rsvpRepository;
    }

    @Transactional
    public TicketResponse issueTicket(Long eventId, String authenticatedEmail) {
        User attendee = requireAuthenticatedUser(authenticatedEmail);

        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Event not found"));

        Optional<Ticket> existingTicket = ticketRepository.findByEventIdAndAttendeeId(eventId, attendee.getId());
        if (existingTicket.isPresent()) {
            Ticket ticket = existingTicket.get();
            if (ticket.getStatus() != TicketStatus.CANCELLED) {
                ensureRsvpRecord(event, attendee);
                return TicketResponse.fromEntity(ticket);
            }
            // Reactivate a previously cancelled ticket if event is published
            if (event.getStatus() != EventStatus.PUBLISHED) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Tickets can only be issued for published events"
                );
            }
            ticket.setStatus(TicketStatus.ACTIVE);
            ensureRsvpRecord(event, attendee);
            return TicketResponse.fromEntity(ticketRepository.save(ticket));
        }

        if (event.getStatus() != EventStatus.PUBLISHED) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Tickets can only be issued for published events"
            );
        }

        long activeTicketCount = ticketRepository.countByEventIdAndStatusNot(eventId, TicketStatus.CANCELLED);
        if (event.getCapacity() != null && activeTicketCount >= event.getCapacity()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Event is full");
        }

        ensureRsvpRecord(event, attendee);

        String ticketCode = generateUniqueTicketCode();
        Ticket ticket = new Ticket(ticketCode, event, attendee);
        Ticket savedTicket = ticketRepository.save(ticket);
        return TicketResponse.fromEntity(savedTicket);
    }

    private void ensureRsvpRecord(Event event, User attendee) {
        if (rsvpRepository != null && !rsvpRepository.existsByEventIdAndUserId(event.getId(), attendee.getId())) {
            long reserved = rsvpRepository.countByEventId(event.getId());
            if (event.getCapacity() != null && reserved >= event.getCapacity()) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Event is full");
            }
            rsvpRepository.save(new Rsvp(event, attendee));
        }
    }

    @Transactional
    public List<TicketResponse> getMyTickets(String authenticatedEmail) {
        User attendee = requireAuthenticatedUser(authenticatedEmail);

        // Auto-reconcile any existing RSVPs that do not yet have a Ticket row
        if (rsvpRepository != null) {
            List<Rsvp> userRsvps = rsvpRepository.findByUserId(attendee.getId());
            for (Rsvp rsvp : userRsvps) {
                Event event = rsvp.getEvent();
                if (event != null && ticketRepository.findByEventIdAndAttendeeId(event.getId(), attendee.getId()).isEmpty()) {
                    String ticketCode = generateUniqueTicketCode();
                    ticketRepository.save(new Ticket(ticketCode, event, attendee));
                }
            }
        }

        return ticketRepository.findByAttendeeIdOrderByIssuedAtDesc(attendee.getId())
                .stream()
                .map(TicketResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public TicketResponse getMyTicketByCode(String ticketCode, String authenticatedEmail) {
        User attendee = requireAuthenticatedUser(authenticatedEmail);

        if (ticketCode == null || ticketCode.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ticket code is required");
        }

        String normalizedCode = ticketCode.trim().toUpperCase(Locale.ROOT);
        Ticket ticket = ticketRepository.findByTicketCode(normalizedCode)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ticket not found"));

        if (ticket.getAttendee() == null || !ticket.getAttendee().getId().equals(attendee.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not have permission to view this ticket");
        }

        return TicketResponse.fromEntity(ticket);
    }

    @Transactional
    public TicketResponse cancelMyTicket(String ticketCode, String authenticatedEmail) {
        User attendee = requireAuthenticatedUser(authenticatedEmail);

        if (ticketCode == null || ticketCode.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ticket code is required");
        }

        String normalizedCode = ticketCode.trim().toUpperCase(Locale.ROOT);
        Ticket ticket = ticketRepository.findByTicketCode(normalizedCode)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ticket not found"));

        if (ticket.getAttendee() == null || !ticket.getAttendee().getId().equals(attendee.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not have permission to cancel this ticket");
        }

        if (ticket.getStatus() == TicketStatus.CHECKED_IN) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Cannot cancel a ticket that has already been checked in"
            );
        }

        ticket.markCancelled();
        Ticket saved = ticketRepository.save(ticket);

        Long eventId = ticket.getEvent() != null ? ticket.getEvent().getId() : null;
        if (rsvpRepository != null && eventId != null) {
            rsvpRepository.deleteByEventIdAndUserId(eventId, attendee.getId());
        }

        return TicketResponse.fromEntity(saved);
    }

    @Transactional
    public int cancelTicketsForEvent(Long eventId) {
        List<Ticket> tickets = ticketRepository.findByEventId(eventId);
        int cancelledCount = 0;
        for (Ticket ticket : tickets) {
            if (ticket.getStatus() == TicketStatus.ACTIVE) {
                ticket.markCancelled();
                ticketRepository.save(ticket);
                cancelledCount++;
            }
        }
        return cancelledCount;
    }

    private User requireAuthenticatedUser(String email) {
        if (email == null || email.isBlank() || "anonymousUser".equalsIgnoreCase(email)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
    }

    private String generateUniqueTicketCode() {
        for (int attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt++) {
            String candidate = "OF-" + randomSegment() + "-" + randomSegment();
            if (!ticketRepository.existsByTicketCode(candidate)) {
                return candidate;
            }
        }
        throw new ResponseStatusException(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "Unable to generate a unique ticket code"
        );
    }

    private String randomSegment() {
        StringBuilder sb = new StringBuilder(SEGMENT_LENGTH);
        for (int i = 0; i < SEGMENT_LENGTH; i++) {
            int idx = secureRandom.nextInt(CODE_ALPHABET.length());
            sb.append(CODE_ALPHABET.charAt(idx));
        }
        return sb.toString();
    }
}
