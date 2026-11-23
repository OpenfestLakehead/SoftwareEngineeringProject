package com.example.Openfest.controller;

import com.example.Openfest.dto.TicketResponse;
import com.example.Openfest.service.TicketService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tickets")
public class TicketController {

    private final TicketService ticketService;

    public TicketController(TicketService ticketService) {
        this.ticketService = ticketService;
    }

    @GetMapping("/my-tickets")
    public ResponseEntity<List<TicketResponse>> getMyTickets(Authentication authentication) {
        String authenticatedEmail = authentication != null ? authentication.getName() : null;
        List<TicketResponse> tickets = ticketService.getMyTickets(authenticatedEmail);
        return ResponseEntity.ok(tickets);
    }

    @GetMapping("/{ticketCode}")
    public ResponseEntity<TicketResponse> getTicketByCode(
            @PathVariable String ticketCode,
            Authentication authentication) {
        String authenticatedEmail = authentication != null ? authentication.getName() : null;
        TicketResponse ticket = ticketService.getMyTicketByCode(ticketCode, authenticatedEmail);
        return ResponseEntity.ok(ticket);
    }

    @PostMapping("/issue/{eventId}")
    public ResponseEntity<TicketResponse> issueTicket(
            @PathVariable Long eventId,
            Authentication authentication) {
        String authenticatedEmail = authentication != null ? authentication.getName() : null;
        TicketResponse ticket = ticketService.issueTicket(eventId, authenticatedEmail);
        return ResponseEntity.status(HttpStatus.CREATED).body(ticket);
    }

    @PatchMapping("/{ticketCode}/cancel")
    public ResponseEntity<TicketResponse> cancelTicket(
            @PathVariable String ticketCode,
            Authentication authentication) {
        String authenticatedEmail = authentication != null ? authentication.getName() : null;
        TicketResponse cancelled = ticketService.cancelMyTicket(ticketCode, authenticatedEmail);
        return ResponseEntity.ok(cancelled);
    }
}
