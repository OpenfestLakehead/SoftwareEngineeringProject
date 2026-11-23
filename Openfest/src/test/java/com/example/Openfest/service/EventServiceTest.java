package com.example.Openfest.service;

import com.example.Openfest.dto.CreateEventRequest;
import com.example.Openfest.dto.EventResponse;
import com.example.Openfest.dto.UpdateEventRequest;
import com.example.Openfest.entity.AgeRestriction;
import com.example.Openfest.entity.Event;
import com.example.Openfest.entity.EventStatus;
import com.example.Openfest.entity.User;
import com.example.Openfest.repository.EventRepository;
import com.example.Openfest.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

import java.lang.reflect.Field;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EventServiceTest {

    @Mock
    private EventRepository eventRepository;

    @Mock
    private UserRepository userRepository;

    private EventService eventService;

    @BeforeEach
    void setUp() {
        PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
        eventService = new EventService(eventRepository, userRepository, passwordEncoder);
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

    @Test
    void createDraftEvent_WithAuthenticatedUser_Success() {
        User creator = new User("creator@openfest.com", "hashedPassword");
        CreateEventRequest request = new CreateEventRequest(
                "Outdoor Music Fest",
                "Great summer outdoors music",
                "Central Park, NY",
                500,
                AgeRestriction.ALL_AGES,
                new BigDecimal("25.00"),
                EventStatus.DRAFT
        );

        when(userRepository.findByEmail("creator@openfest.com")).thenReturn(Optional.of(creator));
        when(eventRepository.save(any(Event.class))).thenAnswer(invocation -> invocation.getArgument(0));

        EventResponse response = eventService.createEvent(request, "creator@openfest.com");

        assertNotNull(response);
        assertEquals("Outdoor Music Fest", response.getTitle());
        assertEquals("Central Park, NY", response.getLocation());
        assertEquals(500, response.getCapacity());
        assertEquals(EventStatus.DRAFT, response.getStatus());
        assertEquals("creator@openfest.com", response.getCreatorEmail());
    }

    @Test
    void createPublishedEvent_FallbackMockUser_Success() {
        User mockUser = new User("mock-creator@openfest.com", "hashedPassword");
        CreateEventRequest request = new CreateEventRequest(
                "Food Truck Rally",
                "Delicious food outdoors",
                "Town Square",
                200,
                AgeRestriction.EIGHTEEN_PLUS,
                BigDecimal.ZERO,
                EventStatus.PUBLISHED
        );

        when(userRepository.findByEmail("mock-creator@openfest.com")).thenReturn(Optional.of(mockUser));
        when(eventRepository.save(any(Event.class))).thenAnswer(invocation -> invocation.getArgument(0));

        EventResponse response = eventService.createEvent(request, null);

        assertNotNull(response);
        assertEquals("Food Truck Rally", response.getTitle());
        assertEquals(EventStatus.PUBLISHED, response.getStatus());
        assertEquals("mock-creator@openfest.com", response.getCreatorEmail());
    }

    @Test
    void getEventsByCreator_ReturnsCreatorEvents() {
        User creator = new User("creator@openfest.com", "hashedPassword");
        setId(creator, 1L);

        Event event1 = new Event(creator, "Event 1", "Desc 1", "Loc 1", 100, AgeRestriction.ALL_AGES, BigDecimal.TEN, EventStatus.PUBLISHED);
        Event event2 = new Event(creator, "Event 2", "Desc 2", "Loc 2", 200, AgeRestriction.EIGHTEEN_PLUS, BigDecimal.ZERO, EventStatus.DRAFT);

        when(userRepository.findByEmail("creator@openfest.com")).thenReturn(Optional.of(creator));
        when(eventRepository.findByCreatorIdOrderByCreatedAtDesc(1L)).thenReturn(List.of(event1, event2));

        List<EventResponse> events = eventService.getEventsByCreator("creator@openfest.com");

        assertEquals(2, events.size());
        assertEquals("Event 1", events.get(0).getTitle());
        assertEquals("Event 2", events.get(1).getTitle());
    }

    @Test
    void updateEvent_Success() {
        User creator = new User("creator@openfest.com", "hashedPassword");
        setId(creator, 1L);

        Event event = new Event(creator, "Old Title", "Old Desc", "Old Loc", 50, AgeRestriction.ALL_AGES, BigDecimal.ZERO, EventStatus.DRAFT);
        setId(event, 10L);

        UpdateEventRequest updateRequest = new UpdateEventRequest(
                "Updated Title",
                "Updated Desc",
                "New Loc",
                150,
                AgeRestriction.TWENTY_ONE_PLUS,
                new BigDecimal("15.50"),
                EventStatus.PUBLISHED
        );

        when(eventRepository.findById(10L)).thenReturn(Optional.of(event));
        when(userRepository.findByEmail("creator@openfest.com")).thenReturn(Optional.of(creator));
        when(eventRepository.save(any(Event.class))).thenAnswer(invocation -> invocation.getArgument(0));

        EventResponse response = eventService.updateEvent(10L, updateRequest, "creator@openfest.com");

        assertEquals("Updated Title", response.getTitle());
        assertEquals("Updated Desc", response.getDescription());
        assertEquals("New Loc", response.getLocation());
        assertEquals(150, response.getCapacity());
        assertEquals(AgeRestriction.TWENTY_ONE_PLUS, response.getAgeRestriction());
        assertEquals(new BigDecimal("15.50"), response.getPrice());
        assertEquals(EventStatus.PUBLISHED, response.getStatus());
    }

    @Test
    void updateEventStatus_CloseSignUps_Success() {
        User creator = new User("creator@openfest.com", "hashedPassword");
        setId(creator, 1L);

        Event event = new Event(creator, "Fest", "Desc", "Loc", 100, AgeRestriction.ALL_AGES, BigDecimal.ZERO, EventStatus.PUBLISHED);
        setId(event, 20L);

        when(eventRepository.findById(20L)).thenReturn(Optional.of(event));
        when(userRepository.findByEmail("creator@openfest.com")).thenReturn(Optional.of(creator));
        when(eventRepository.save(any(Event.class))).thenAnswer(invocation -> invocation.getArgument(0));

        EventResponse response = eventService.updateEventStatus(20L, EventStatus.CLOSED, "creator@openfest.com");

        assertEquals(EventStatus.CLOSED, response.getStatus());
    }

    @Test
    void updateEvent_UnauthorizedCreator_ThrowsResponseStatusException() {
        User creator = new User("creator@openfest.com", "hashedPassword");
        setId(creator, 1L);

        User anotherUser = new User("other@openfest.com", "hashedPassword");
        setId(anotherUser, 2L);

        Event event = new Event(creator, "Fest", "Desc", "Loc", 100, AgeRestriction.ALL_AGES, BigDecimal.ZERO, EventStatus.PUBLISHED);
        setId(event, 30L);

        when(eventRepository.findById(30L)).thenReturn(Optional.of(event));
        when(userRepository.findByEmail("other@openfest.com")).thenReturn(Optional.of(anotherUser));

        UpdateEventRequest updateRequest = new UpdateEventRequest(
                "Hijack", "Desc", "Loc", 10, AgeRestriction.ALL_AGES, BigDecimal.ZERO, EventStatus.PUBLISHED
        );

        assertThrows(ResponseStatusException.class, () ->
                eventService.updateEvent(30L, updateRequest, "other@openfest.com")
        );
    }

    @Test
    void getPublishedEvents_NoFilters_ReturnsOnlyPublishedEvents() {
        User creator = new User("creator@openfest.com", "hashedPassword");
        Event publishedEvent = new Event(creator, "Summer Jam", "Live music", "Thunder Bay, Ontario, Canada", 200, AgeRestriction.ALL_AGES, BigDecimal.ZERO, EventStatus.PUBLISHED);
        Event draftEvent = new Event(creator, "Draft Fest", "Unpublished", "Toronto, Ontario, Canada", 100, AgeRestriction.ALL_AGES, BigDecimal.TEN, EventStatus.DRAFT);
        Event closedEvent = new Event(creator, "Closed Fest", "Closed", "Ottawa, Ontario, Canada", 100, AgeRestriction.ALL_AGES, BigDecimal.TEN, EventStatus.CLOSED);
        Event soldOutEvent = new Event(creator, "Sold Out Fest", "Full", "London, Ontario, Canada", 100, AgeRestriction.ALL_AGES, BigDecimal.TEN, EventStatus.SOLD_OUT);

        when(eventRepository.findByStatusOrderByCreatedAtDesc(EventStatus.PUBLISHED))
                .thenReturn(List.of(publishedEvent, draftEvent, closedEvent, soldOutEvent));

        List<EventResponse> results = eventService.getPublishedEvents(null, null, null, null, null);

        assertEquals(1, results.size());
        assertEquals("Summer Jam", results.get(0).getTitle());
        assertEquals(EventStatus.PUBLISHED, results.get(0).getStatus());
        verify(eventRepository).findByStatusOrderByCreatedAtDesc(EventStatus.PUBLISHED);
    }

    @Test
    void getPublishedEvents_KeywordAndCityFilters_MatchesCaseInsensitively() {
        User creator = new User("creator@openfest.com", "hashedPassword");
        Event matchByTitle = new Event(creator, "Jazz Night", null, "Thunder Bay, Ontario, Canada", 120, AgeRestriction.EIGHTEEN_PLUS, new BigDecimal("15.00"), EventStatus.PUBLISHED);
        Event matchByDesc = new Event(creator, "Lakefront Gathering", "Evening JAZZ showcase by the harbor", "Thunder Bay, Ontario, Canada", 150, AgeRestriction.ALL_AGES, BigDecimal.ZERO, EventStatus.PUBLISHED);
        Event differentCity = new Event(creator, "Jazz Brunch", "Sunday jazz", "Toronto, Ontario, Canada", 80, AgeRestriction.ALL_AGES, new BigDecimal("20.00"), EventStatus.PUBLISHED);

        when(eventRepository.findByStatusOrderByCreatedAtDesc(EventStatus.PUBLISHED))
                .thenReturn(List.of(matchByTitle, matchByDesc, differentCity));

        List<EventResponse> results = eventService.getPublishedEvents("jazz", "thunder bay", null, null, null);

        assertEquals(2, results.size());
        assertEquals("Jazz Night", results.get(0).getTitle());
        assertEquals("Lakefront Gathering", results.get(1).getTitle());
    }

    @Test
    void getPublishedEvents_PriceFilters_FiltersFreeOnlyAndMaxPrice() {
        User creator = new User("creator@openfest.com", "hashedPassword");
        Event freeEvent = new Event(creator, "Free Park Yoga", "Morning session", "Ottawa, Ontario, Canada", 50, AgeRestriction.ALL_AGES, BigDecimal.ZERO, EventStatus.PUBLISHED);
        Event midEvent = new Event(creator, "Indie Concert", "Live bands", "Ottawa, Ontario, Canada", 100, AgeRestriction.EIGHTEEN_PLUS, new BigDecimal("25.00"), EventStatus.PUBLISHED);
        Event priceyEvent = new Event(creator, "VIP Gala", "Dinner & show", "Ottawa, Ontario, Canada", 40, AgeRestriction.TWENTY_ONE_PLUS, new BigDecimal("95.00"), EventStatus.PUBLISHED);

        when(eventRepository.findByStatusOrderByCreatedAtDesc(EventStatus.PUBLISHED))
                .thenReturn(List.of(freeEvent, midEvent, priceyEvent));

        List<EventResponse> freeResults = eventService.getPublishedEvents(null, null, true, null, null);
        assertEquals(1, freeResults.size());
        assertEquals("Free Park Yoga", freeResults.get(0).getTitle());

        List<EventResponse> maxPriceResults = eventService.getPublishedEvents(null, null, false, new BigDecimal("25.00"), null);
        assertEquals(2, maxPriceResults.size());
        assertEquals("Free Park Yoga", maxPriceResults.get(0).getTitle());
        assertEquals("Indie Concert", maxPriceResults.get(1).getTitle());
    }

    @Test
    void getPublishedEvents_AgeRestrictionFilter_StrictMatch() {
        User creator = new User("creator@openfest.com", "hashedPassword");
        Event allAges = new Event(creator, "Family Picnic", "Outdoor fun", "London, Ontario, Canada", 300, AgeRestriction.ALL_AGES, BigDecimal.ZERO, EventStatus.PUBLISHED);
        Event eighteenPlus = new Event(creator, "Night Market", "Outdoor food & drinks", "London, Ontario, Canada", 200, AgeRestriction.EIGHTEEN_PLUS, new BigDecimal("10.00"), EventStatus.PUBLISHED);
        Event twentyOnePlus = new Event(creator, "Craft Tasting", "Outdoor tasting", "London, Ontario, Canada", 100, AgeRestriction.TWENTY_ONE_PLUS, new BigDecimal("35.00"), EventStatus.PUBLISHED);

        when(eventRepository.findByStatusOrderByCreatedAtDesc(EventStatus.PUBLISHED))
                .thenReturn(List.of(allAges, eighteenPlus, twentyOnePlus));

        List<EventResponse> ageOnly = eventService.getPublishedEvents(null, null, null, null, AgeRestriction.EIGHTEEN_PLUS);
        assertEquals(1, ageOnly.size());
        assertEquals("Night Market", ageOnly.get(0).getTitle());

        List<EventResponse> combined = eventService.getPublishedEvents("outdoor", "London, Ontario, Canada", false, new BigDecimal("15.00"), AgeRestriction.EIGHTEEN_PLUS);
        assertEquals(1, combined.size());
        assertEquals("Night Market", combined.get(0).getTitle());
    }
}
