
package com.example.Openfest.security;

import com.example.Openfest.config.SecurityConfig;
import com.example.Openfest.controller.AuthController;
import com.example.Openfest.controller.EventController;
import com.example.Openfest.dto.EventResponse;
import com.example.Openfest.entity.AgeRestriction;
import com.example.Openfest.entity.Event;
import com.example.Openfest.entity.EventStatus;
import com.example.Openfest.entity.User;
import com.example.Openfest.repository.UserRepository;
import com.example.Openfest.service.AuthService;
import com.example.Openfest.service.CustomUserDetailsService;
import com.example.Openfest.service.EventService;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Authentication integration tests.
 *
 * Tests:
 * - Spring Security authentication
 * - BCrypt password verification
 * - CSRF protection
 * - HTTP session persistence
 * - Authorization
 * - Logout
 *
 * Database access is mocked using Mockito.
 */
@WebMvcTest(controllers = {AuthController.class, EventController.class})
@Import({
    SecurityConfig.class,
    CustomUserDetailsService.class
})
class AuthenticationIntegrationTest {

    private static final String EMAIL =
        "test@example.com";

    private static final String PASSWORD =
        "CorrectPassword123!";

    @Autowired
    private MockMvc mvc;

    @Autowired
    private PasswordEncoder encoder;

    @MockitoBean
    private UserRepository users;

    @MockitoBean
    private AuthService authService;

    @MockitoBean
    private EventService eventService;

    /**
     * Prepare an existing user before every test.
     */
    @BeforeEach
    void givenRegisteredUser() {

        User user = new User(
            EMAIL,
            encoder.encode(PASSWORD)
        );

        when(users.findByEmail(EMAIL))
            .thenReturn(Optional.of(user));
    }

    /**
     * Helper: authenticate with valid credentials.
     */
    private MvcResult login() throws Exception {

        return mvc.perform(
                post("/api/auth/login")
                    .with(csrf())
                    .contentType(
                        MediaType.APPLICATION_FORM_URLENCODED
                    )
                    .param("email", EMAIL)
                    .param("password", PASSWORD)
            )
            .andExpect(status().isOk())
            .andExpect(
                jsonPath("$.message")
                    .value("Login successful")
            )
            .andReturn();
    }

    // ========================================
    // TEST 1: CSRF TOKEN
    // ========================================

    @Test
    void csrfEndpointExposesToken() throws Exception {

        mvc.perform(get("/api/auth/csrf"))
            .andExpect(status().isOk())
            .andExpect(
                jsonPath("$.token").isNotEmpty()
            )
            .andExpect(
                jsonPath("$.headerName")
                    .value("X-CSRF-TOKEN")
            );
    }

    // ========================================
    // TEST 2: VALID LOGIN + SESSION
    // ========================================

    @Test
    void validCredentialsCreateAuthenticatedSession()
            throws Exception {

        MvcResult result = login();

        MockHttpSession session =
            (MockHttpSession) result
                .getRequest()
                .getSession(false);

        assertNotNull(session);

        mvc.perform(
                get("/api/auth/me")
                    .session(session)
            )
            .andExpect(status().isOk())
            .andExpect(
                jsonPath("$.email").value(EMAIL)
            );
    }

    // ========================================
    // TEST 3: CASE-INSENSITIVE EMAIL
    // ========================================

    @Test
    void emailLookupIsCaseInsensitive()
            throws Exception {

        mvc.perform(
                post("/api/auth/login")
                    .with(csrf())
                    .param(
                        "email",
                        "TEST@EXAMPLE.COM"
                    )
                    .param("password", PASSWORD)
            )
            .andExpect(status().isOk());
    }

    // ========================================
    // TEST 4: INCORRECT PASSWORD
    // ========================================

    @Test
    void wrongPasswordIsRejected()
            throws Exception {

        mvc.perform(
                post("/api/auth/login")
                    .with(csrf())
                    .param("email", EMAIL)
                    .param(
                        "password",
                        "wrong-password"
                    )
            )
            .andExpect(status().isUnauthorized());
    }

    // ========================================
    // TEST 5: UNKNOWN USER
    // ========================================

    @Test
    void nonexistentAccountIsRejected()
            throws Exception {

        when(
            users.findByEmail(
                "missing@example.com"
            )
        ).thenReturn(Optional.empty());

        mvc.perform(
                post("/api/auth/login")
                    .with(csrf())
                    .param(
                        "email",
                        "missing@example.com"
                    )
                    .param("password", PASSWORD)
            )
            .andExpect(status().isUnauthorized());
    }

    // ========================================
    // TEST 6: MISSING CSRF TOKEN
    // ========================================

    @Test
    void loginWithoutCsrfIsForbidden()
            throws Exception {

        mvc.perform(
                post("/api/auth/login")
                    .param("email", EMAIL)
                    .param("password", PASSWORD)
            )
            .andExpect(status().isForbidden());
    }

    // ========================================
    // TEST 7: INVALID CSRF TOKEN
    // ========================================

    @Test
    void invalidCsrfIsForbidden()
            throws Exception {

        mvc.perform(
                post("/api/auth/login")
                    .with(
                        csrf().useInvalidToken()
                    )
                    .param("email", EMAIL)
                    .param("password", PASSWORD)
            )
            .andExpect(status().isForbidden());
    }

    // ========================================
    // TEST 8: UNAUTHENTICATED USER
    // ========================================

    @Test
    void anonymousMeIsUnauthorized()
            throws Exception {

        mvc.perform(get("/api/auth/me"))
            .andExpect(status().isUnauthorized());
    }

    // ========================================
    // TEST 9: PROTECTED EVENT CREATION
    // ========================================

    @Test
    void anonymousEventCreationIsUnauthorizedWhenCsrfIsValid()
            throws Exception {

        mvc.perform(
                post("/api/events")
                    .with(csrf())
                    .contentType(
                        MediaType.APPLICATION_JSON
                    )
                    .content("{}")
            )
            .andExpect(status().isUnauthorized());
    }

    // ========================================
    // TEST 10: LOGOUT
    // ========================================

    @Test
    void logoutInvalidatesAuthenticatedSession()
            throws Exception {

        MvcResult result = login();

        MockHttpSession session =
            (MockHttpSession) result
                .getRequest()
                .getSession(false);

        assertNotNull(session);

        mvc.perform(
                post("/api/auth/logout")
                    .session(session)
                    .with(csrf())
            )
            .andExpect(status().isOk())
            .andExpect(
                jsonPath("$.message")
                    .value("Logged out")
            );

        assertTrue(session.isInvalid());
    }

    // ========================================
    // TEST 11: PUBLIC EVENT DISCOVERY
    // ========================================

    @Test
    void anonymousPublicEventDiscoveryIsPermitted()
            throws Exception {

        Event event = new Event(
            new User("creator@openfest.com", "hashedPassword"),
            "Lakehead Music Fest",
            "Outdoor concert",
            "Thunder Bay, Ontario, Canada",
            250,
            AgeRestriction.ALL_AGES,
            BigDecimal.ZERO,
            EventStatus.PUBLISHED
        );

        when(eventService.getPublishedEvents(null, null, null, null, null))
            .thenReturn(List.of(EventResponse.fromEntity(event)));

        mvc.perform(get("/api/events"))
            .andExpect(status().isOk())
            .andExpect(
                jsonPath("$[0].title")
                    .value("Lakehead Music Fest")
            )
            .andExpect(
                jsonPath("$[0].location")
                    .value("Thunder Bay, Ontario, Canada")
            )
            .andExpect(
                jsonPath("$[0].status")
                    .value("PUBLISHED")
            );
    }
}
