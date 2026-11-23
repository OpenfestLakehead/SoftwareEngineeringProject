package com.example.Openfest.service;

import com.example.Openfest.dto.TicketResponse;
import com.example.Openfest.entity.AgeRestriction;
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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.lang.reflect.Field;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TicketServiceTest {

    @Mock
    private TicketRepository ticketRepository;

    @Mock
    private EventRepository eventRepository;

    @Mock
    private UserRepository userRepository;

    private TicketService ticketService;

    @BeforeEach
    void setUp() {
        ticketService = new TicketService(ticketRepository, eventRepository, userRepository);
    }

    private void setId(Object target, Long id) {
        try {
            Field idField = target.getClass().getDeclaredField("id");
            idField.setAccessible(true);
            idField.set(target, id);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    private User createTestUser(Long id, String email) {
        User user = new User(email, "hashedPassword");
        setId(user, id);
        return user;
    }

    private Event createTestEvent(Long id, User creator, String title, EventStatus status) {
        Event event = new Event(
                creator,
                title,
                "Outdoor concert description",
                "Zilker Park, Austin, TX",
                250,
                AgeRestriction.ALL_AGES,
                BigDecimal.ZERO,
                status
        );
        setId(event, id);
        return event;
    }

    @Test
    void issueTicket_Success_GeneratesFormattedAlphanumericCode() {
        User creator = createTestUser(1L, "creator@openfest.com");
        User attendee = createTestUser(2L, "attendee@openfest.com");
        Event event = createTestEvent(10L, creator, "Summer Jazz Fest", EventStatus.PUBLISHED);

        when(userRepository.findByEmail("attendee@openfest.com")).thenReturn(Optional.of(attendee));
        when(eventRepository.findById(10L)).thenReturn(Optional.of(event));
        when(ticketRepository.findByEventIdAndAttendeeId(10L, 2L)).thenReturn(Optional.empty());
        when(ticketRepository.existsByTicketCode(anyString())).thenReturn(false);
        when(ticketRepository.save(any(Ticket.class))).thenAnswer(inv -> {
            Ticket saved = inv.getArgument(0);
            setId(saved, 100L);
            return saved;
        });

        TicketResponse response = ticketService.issueTicket(10L, "attendee@openfest.com");

        assertNotNull(response);
        assertEquals(100L, response.getId());
        assertNotNull(response.getTicketCode());
        assertTrue(response.getTicketCode().matches("^OF-[A-Z2-9]{4}-[A-Z2-9]{4}$"));
        assertEquals(TicketStatus.ACTIVE, response.getStatus());
        assertEquals("Summer Jazz Fest", response.getEventTitle());
        assertEquals("Zilker Park, Austin, TX", response.getEventLocation());
        assertEquals(EventStatus.PUBLISHED, response.getEventStatus());
        assertEquals("attendee@openfest.com", response.getAttendeeEmail());
    }

    @Test
    void issueTicket_Idempotent_ReturnsExistingActiveTicket() {
        User creator = createTestUser(1L, "creator@openfest.com");
        User attendee = createTestUser(2L, "attendee@openfest.com");
        Event event = createTestEvent(10L, creator, "Summer Jazz Fest", EventStatus.PUBLISHED);
        Ticket existingTicket = new Ticket("OF-ABCD-2345", event, attendee);
        setId(existingTicket, 55L);

        when(userRepository.findByEmail("attendee@openfest.com")).thenReturn(Optional.of(attendee));
        when(eventRepository.findById(10L)).thenReturn(Optional.of(event));
        when(ticketRepository.findByEventIdAndAttendeeId(10L, 2L)).thenReturn(Optional.of(existingTicket));

        TicketResponse response = ticketService.issueTicket(10L, "attendee@openfest.com");

        assertEquals(55L, response.getId());
        assertEquals("OF-ABCD-2345", response.getTicketCode());
        verify(ticketRepository, never()).save(any(Ticket.class));
    }

    @Test
    void issueTicket_UnpublishedEvent_ThrowsBadRequest() {
        User creator = createTestUser(1L, "creator@openfest.com");
        User attendee = createTestUser(2L, "attendee@openfest.com");
        Event draftEvent = createTestEvent(10L, creator, "Draft Fest", EventStatus.DRAFT);

        when(userRepository.findByEmail("attendee@openfest.com")).thenReturn(Optional.of(attendee));
        when(eventRepository.findById(10L)).thenReturn(Optional.of(draftEvent));
        when(ticketRepository.findByEventIdAndAttendeeId(10L, 2L)).thenReturn(Optional.empty());

        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> ticketService.issueTicket(10L, "attendee@openfest.com")
        );
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
    }

    @Test
    void getMyTickets_ReturnsAttendeeTicketsWithSynchronizedEventDetails() {
        User creator = createTestUser(1L, "creator@openfest.com");
        User attendee = createTestUser(2L, "attendee@openfest.com");
        Event event1 = createTestEvent(10L, creator, "Lakeside Acoustic", EventStatus.PUBLISHED);
        Event event2 = createTestEvent(11L, creator, "Mountain Trail Run", EventStatus.CLOSED);

        Ticket activeTicket = new Ticket("OF-2345-ABCD", event1, attendee);
        setId(activeTicket, 101L);

        Ticket checkedInTicket = new Ticket("OF-6789-EFGH", event2, attendee);
        setId(checkedInTicket, 102L);
        checkedInTicket.markCheckedIn();

        when(userRepository.findByEmail("attendee@openfest.com")).thenReturn(Optional.of(attendee));
        when(ticketRepository.findByAttendeeIdOrderByIssuedAtDesc(2L))
                .thenReturn(List.of(activeTicket, checkedInTicket));

        List<TicketResponse> tickets = ticketService.getMyTickets("attendee@openfest.com");

        assertEquals(2, tickets.size());
        assertEquals("OF-2345-ABCD", tickets.get(0).getTicketCode());
        assertEquals(TicketStatus.ACTIVE, tickets.get(0).getStatus());
        assertEquals(EventStatus.PUBLISHED, tickets.get(0).getEventStatus());

        assertEquals("OF-6789-EFGH", tickets.get(1).getTicketCode());
        assertEquals(TicketStatus.CHECKED_IN, tickets.get(1).getStatus());
        assertNotNull(tickets.get(1).getCheckedInAt());
        assertEquals(EventStatus.CLOSED, tickets.get(1).getEventStatus());
    }

    @Test
    void getMyTickets_Unauthenticated_ThrowsUnauthorized() {
        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> ticketService.getMyTickets(null)
        );
        assertEquals(HttpStatus.UNAUTHORIZED, ex.getStatusCode());
    }

    @Test
    void getMyTicketByCode_OwnerSuccess_NormalizesCase() {
        User creator = createTestUser(1L, "creator@openfest.com");
        User attendee = createTestUser(2L, "attendee@openfest.com");
        Event event = createTestEvent(10L, creator, "Sunset Yoga", EventStatus.PUBLISHED);
        Ticket ticket = new Ticket("OF-K9P2-M4X7", event, attendee);
        setId(ticket, 200L);

        when(userRepository.findByEmail("attendee@openfest.com")).thenReturn(Optional.of(attendee));
        when(ticketRepository.findByTicketCode("OF-K9P2-M4X7")).thenReturn(Optional.of(ticket));

        TicketResponse response = ticketService.getMyTicketByCode("  of-k9p2-m4x7 ", "attendee@openfest.com");

        assertEquals("OF-K9P2-M4X7", response.getTicketCode());
        assertEquals("Sunset Yoga", response.getEventTitle());
    }

    @Test
    void getMyTicketByCode_DifferentUser_ThrowsForbidden() {
        User creator = createTestUser(1L, "creator@openfest.com");
        User owner = createTestUser(2L, "owner@openfest.com");
        User intruder = createTestUser(3L, "intruder@openfest.com");
        Event event = createTestEvent(10L, creator, "Sunset Yoga", EventStatus.PUBLISHED);
        Ticket ticket = new Ticket("OF-K9P2-M4X7", event, owner);
        setId(ticket, 200L);

        when(userRepository.findByEmail("intruder@openfest.com")).thenReturn(Optional.of(intruder));
        when(ticketRepository.findByTicketCode("OF-K9P2-M4X7")).thenReturn(Optional.of(ticket));

        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> ticketService.getMyTicketByCode("OF-K9P2-M4X7", "intruder@openfest.com")
        );
        assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode());
    }

    @Test
    void getMyTicketByCode_NotFound_ThrowsNotFound() {
        User attendee = createTestUser(2L, "attendee@openfest.com");
        when(userRepository.findByEmail("attendee@openfest.com")).thenReturn(Optional.of(attendee));
        when(ticketRepository.findByTicketCode("OF-NONE-0000")).thenReturn(Optional.empty());

        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> ticketService.getMyTicketByCode("OF-NONE-0000", "attendee@openfest.com")
        );
        assertEquals(HttpStatus.NOT_FOUND, ex.getStatusCode());
    }

    @Test
    void cancelTicketsForEvent_CancelsActiveTicketsOnly() {
        User creator = createTestUser(1L, "creator@openfest.com");
        User attendee1 = createTestUser(2L, "a1@openfest.com");
        User attendee2 = createTestUser(3L, "a2@openfest.com");
        Event event = createTestEvent(10L, creator, "Cancelled Fest", EventStatus.CLOSED);

        Ticket activeTicket = new Ticket("OF-AAAA-2222", event, attendee1);
        Ticket alreadyCheckedIn = new Ticket("OF-BBBB-3333", event, attendee2);
        alreadyCheckedIn.markCheckedIn();

        when(ticketRepository.findByEventId(10L)).thenReturn(List.of(activeTicket, alreadyCheckedIn));

        int cancelled = ticketService.cancelTicketsForEvent(10L);

        assertEquals(1, cancelled);
        assertEquals(TicketStatus.CANCELLED, activeTicket.getStatus());
        assertEquals(TicketStatus.CHECKED_IN, alreadyCheckedIn.getStatus());
        verify(ticketRepository, times(1)).save(activeTicket);
    }

    @Test
    void getMyTickets_AutoReconcilesExistingRsvpsWithoutTickets() {
        RsvpRepository rsvpRepository = mock(RsvpRepository.class);
        ticketService.setRsvpRepository(rsvpRepository);

        User creator = createTestUser(1L, "creator@openfest.com");
        User attendee = createTestUser(2L, "attendee@openfest.com");
        Event event = createTestEvent(10L, creator, "Reconciled Free Fest", EventStatus.PUBLISHED);
        Rsvp existingRsvp = new Rsvp(event, attendee);

        when(userRepository.findByEmail("attendee@openfest.com")).thenReturn(Optional.of(attendee));
        when(rsvpRepository.findByUserId(2L)).thenReturn(List.of(existingRsvp));
        when(ticketRepository.findByEventIdAndAttendeeId(10L, 2L)).thenReturn(Optional.empty());
        when(ticketRepository.existsByTicketCode(anyString())).thenReturn(false);
        when(ticketRepository.findByAttendeeIdOrderByIssuedAtDesc(2L)).thenReturn(List.of(
                new Ticket("OF-RECN-2345", event, attendee)
        ));

        List<TicketResponse> responses = ticketService.getMyTickets("attendee@openfest.com");

        verify(ticketRepository, times(1)).save(any(Ticket.class));
        assertEquals(1, responses.size());
        assertEquals("OF-RECN-2345", responses.get(0).getTicketCode());
    }

    @Test
    void cancelMyTicket_Success_MarksCancelledAndRemovesRsvp() {
        RsvpRepository rsvpRepository = mock(RsvpRepository.class);
        ticketService.setRsvpRepository(rsvpRepository);

        User creator = createTestUser(1L, "creator@openfest.com");
        User attendee = createTestUser(2L, "attendee@openfest.com");
        Event event = createTestEvent(10L, creator, "Upcoming Event", EventStatus.PUBLISHED);
        Ticket ticket = new Ticket("OF-CNCL-2345", event, attendee);

        when(userRepository.findByEmail("attendee@openfest.com")).thenReturn(Optional.of(attendee));
        when(ticketRepository.findByTicketCode("OF-CNCL-2345")).thenReturn(Optional.of(ticket));
        when(ticketRepository.save(any(Ticket.class))).thenAnswer(inv -> inv.getArgument(0));

        TicketResponse response = ticketService.cancelMyTicket("of-cncl-2345", "attendee@openfest.com");

        assertEquals(TicketStatus.CANCELLED, response.getStatus());
        verify(ticketRepository, times(1)).save(ticket);
        verify(rsvpRepository, times(1)).deleteByEventIdAndUserId(10L, 2L);
    }

    @Test
    void cancelMyTicket_DifferentUser_ThrowsForbidden() {
        User creator = createTestUser(1L, "creator@openfest.com");
        User owner = createTestUser(2L, "owner@openfest.com");
        User intruder = createTestUser(3L, "intruder@openfest.com");
        Event event = createTestEvent(10L, creator, "Upcoming Event", EventStatus.PUBLISHED);
        Ticket ticket = new Ticket("OF-CNCL-2345", event, owner);

        when(userRepository.findByEmail("intruder@openfest.com")).thenReturn(Optional.of(intruder));
        when(ticketRepository.findByTicketCode("OF-CNCL-2345")).thenReturn(Optional.of(ticket));

        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> ticketService.cancelMyTicket("OF-CNCL-2345", "intruder@openfest.com")
        );
        assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode());
        verify(ticketRepository, never()).save(any(Ticket.class));
    }
}
