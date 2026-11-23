package com.example.Openfest.repository;

import com.example.Openfest.entity.Ticket;
import com.example.Openfest.entity.TicketStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, Long> {

    @EntityGraph(attributePaths = {"event", "attendee"})
    List<Ticket> findByAttendeeIdOrderByIssuedAtDesc(Long attendeeId);

    @EntityGraph(attributePaths = {"event", "attendee"})
    Optional<Ticket> findByTicketCode(String ticketCode);

    @EntityGraph(attributePaths = {"event", "attendee"})
    Optional<Ticket> findByEventIdAndAttendeeId(Long eventId, Long attendeeId);

    @EntityGraph(attributePaths = {"event", "attendee"})
    List<Ticket> findByEventId(Long eventId);

    long countByEventIdAndStatusNot(Long eventId, TicketStatus excludedStatus);

    boolean existsByTicketCode(String ticketCode);
}
