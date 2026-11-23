package com.example.Openfest.repository;

import com.example.Openfest.entity.Rsvp;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RsvpRepository extends JpaRepository<Rsvp, Long> {

    // Prevent duplicate reservations
    boolean existsByEventIdAndUserId(Long eventId, Long userId);

    // Count reservations for an event
    long countByEventId(Long eventId);

    // Find all reservations made by an attendee
    @EntityGraph(attributePaths = {"event", "user"})
    List<Rsvp> findByUserId(Long userId);

    // Find all reservations for a specific event
    @EntityGraph(attributePaths = {"event", "user"})
    List<Rsvp> findByEventId(Long eventId);

    void deleteByEventIdAndUserId(Long eventId, Long userId);
}
