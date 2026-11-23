package com.example.Openfest.service;

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

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class RsvpService {

    public record AttendeeReservationDto(
            Long rsvpId,
            Long eventId,
            String eventTitle,
            String attendeeEmail,
            String ticketCode,
            String ticketStatus,
            LocalDateTime createdAt
    ) {}

    private final RsvpRepository rsvpRepository;
    private final EventRepository eventRepository;
    private final UserRepository userRepository;
    private TicketService ticketService;
    private TicketRepository ticketRepository;

    public RsvpService(
            RsvpRepository rsvpRepository,
            EventRepository eventRepository,
            UserRepository userRepository) {
        this.rsvpRepository = rsvpRepository;
        this.eventRepository = eventRepository;
        this.userRepository = userRepository;
    }

    @Autowired(required = false)
    public void setTicketService(TicketService ticketService) {
        this.ticketService = ticketService;
    }

    @Autowired(required = false)
    public void setTicketRepository(TicketRepository ticketRepository) {
        this.ticketRepository = ticketRepository;
    }

    private User requireUser(String email) {
        if (email == null || email.isBlank()
                || "anonymousUser".equalsIgnoreCase(email)) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED, "Please log in");
        }

        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "User not found"));
    }

    // Reserve a spot at a free event and automatically issue a scannable QR ticket
    @Transactional
    public Rsvp reserveSpot(Long eventId, String email) {

        User attendee = requireUser(email);

        Event event = eventRepository.findByIdForUpdate(eventId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Event not found"));

        if (event.getStatus() != EventStatus.PUBLISHED) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "This event is not open for RSVP");
        }

        if (event.getPrice() == null
                || event.getPrice().compareTo(BigDecimal.ZERO) != 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "RSVP is only available for free events");
        }

        if (rsvpRepository.existsByEventIdAndUserId(
                eventId, attendee.getId())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "You have already RSVP'd to this event");
        }

        long reserved = rsvpRepository.countByEventId(eventId);

        if (event.getCapacity() == null
                || reserved >= event.getCapacity()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "Event is full");
        }

        Rsvp savedRsvp = rsvpRepository.save(new Rsvp(event, attendee));

        if (ticketService != null) {
            ticketService.issueTicket(eventId, email);
        }

        return savedRsvp;
    }

    // Attendee: view their own reservations
    @Transactional(readOnly = true)
    public List<Rsvp> getMyReservations(String email) {
        User attendee = requireUser(email);
        return rsvpRepository.findByUserId(attendee.getId());
    }

    // Creator: view reservations for their own event
    @Transactional(readOnly = true)
    public List<Rsvp> getEventReservations(Long eventId, String email) {
        User currentUser = requireUser(email);

        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Event not found"));

        if (event.getCreator() == null
                || !event.getCreator().getId().equals(currentUser.getId())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Only the event creator can view attendees");
        }

        return rsvpRepository.findByEventId(eventId);
    }

    // Attendee: view their own reservations (reconciling any ticket purchases)
    @Transactional
    public List<AttendeeReservationDto> getMyReservationDtos(String email) {
        User attendee = requireUser(email);

        if (ticketRepository != null) {
            List<Ticket> userTickets = ticketRepository.findByAttendeeIdOrderByIssuedAtDesc(attendee.getId());
            for (Ticket ticket : userTickets) {
                if (ticket.getStatus() != TicketStatus.CANCELLED
                        && ticket.getEvent() != null
                        && !rsvpRepository.existsByEventIdAndUserId(ticket.getEvent().getId(), attendee.getId())) {
                    rsvpRepository.save(new Rsvp(ticket.getEvent(), attendee));
                }
            }
        }

        Map<Long, Ticket> ticketsByEventId = ticketRepository != null
                ? ticketRepository.findByAttendeeIdOrderByIssuedAtDesc(attendee.getId())
                        .stream()
                        .filter(t -> t.getEvent() != null)
                        .collect(Collectors.toMap(
                                t -> t.getEvent().getId(),
                                Function.identity(),
                                (existing, replacement) -> existing
                        ))
                : Map.of();

        return rsvpRepository.findByUserId(attendee.getId())
                .stream()
                .map(rsvp -> {
                    Ticket ticket = ticketsByEventId.get(rsvp.getEvent().getId());
                    return new AttendeeReservationDto(
                            rsvp.getId(),
                            rsvp.getEvent().getId(),
                            rsvp.getEvent().getTitle(),
                            rsvp.getUser().getEmail(),
                            ticket != null ? ticket.getTicketCode() : null,
                            ticket != null ? ticket.getStatus().name() : "ACTIVE",
                            rsvp.getCreatedAt()
                    );
                })
                .toList();
    }

    // Creator: view reservations/attendees for their own event (including paid ticket holders)
    @Transactional
    public List<AttendeeReservationDto> getEventReservationDtos(Long eventId, String email) {
        User currentUser = requireUser(email);

        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Event not found"));

        if (event.getCreator() == null
                || !event.getCreator().getId().equals(currentUser.getId())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Only the event creator can view attendees");
        }

        if (ticketRepository != null) {
            List<Ticket> eventTickets = ticketRepository.findByEventId(eventId);
            for (Ticket ticket : eventTickets) {
                if (ticket.getStatus() != TicketStatus.CANCELLED
                        && ticket.getAttendee() != null
                        && !rsvpRepository.existsByEventIdAndUserId(eventId, ticket.getAttendee().getId())) {
                    rsvpRepository.save(new Rsvp(event, ticket.getAttendee()));
                }
            }
        }

        Map<Long, Ticket> ticketsByAttendeeId = ticketRepository != null
                ? ticketRepository.findByEventId(eventId)
                        .stream()
                        .filter(t -> t.getAttendee() != null)
                        .collect(Collectors.toMap(
                                t -> t.getAttendee().getId(),
                                Function.identity(),
                                (existing, replacement) -> existing
                        ))
                : Map.of();

        return rsvpRepository.findByEventId(eventId)
                .stream()
                .map(rsvp -> {
                    Ticket ticket = ticketsByAttendeeId.get(rsvp.getUser().getId());
                    return new AttendeeReservationDto(
                            rsvp.getId(),
                            rsvp.getEvent().getId(),
                            rsvp.getEvent().getTitle(),
                            rsvp.getUser().getEmail(),
                            ticket != null ? ticket.getTicketCode() : null,
                            ticket != null ? ticket.getStatus().name() : "ACTIVE",
                            rsvp.getCreatedAt()
                    );
                })
                .toList();
    }
}
