package com.example.Openfest.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "events")
public class Event {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "creator_id")
    private User creator;

    @Column(nullable = false, length = 150)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column
    private String addressfield1;

    @Column
    private String city;

    @Column(nullable = false)
    private String location;

    @Column(nullable = false)
    private Integer capacity;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private AgeRestriction ageRestriction;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private EventStatus status;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    protected Event() {
        // Required by JPA
    }

    public Event(User creator, String title, String description, String addressfield1, String city,
                 Integer capacity, AgeRestriction ageRestriction, BigDecimal price, EventStatus status) {
        this.creator = creator;
        this.title = title;
        this.description = description;
        this.addressfield1 = addressfield1;
        this.city = city;
        this.location = formatLocation(addressfield1, city);
        this.capacity = capacity;
        this.ageRestriction = ageRestriction;
        this.price = price;
        this.status = status != null ? status : EventStatus.DRAFT;
        this.createdAt = LocalDateTime.now();
    }

    public Event(User creator, String title, String description, String location,
                 Integer capacity, AgeRestriction ageRestriction, BigDecimal price, EventStatus status) {
        this(creator, title, description, location, location, capacity, ageRestriction, price, status);
        this.location = location;
    }

    private static String formatLocation(String addressfield1, String city) {
        if (addressfield1 != null && !addressfield1.isBlank() && city != null && !city.isBlank()) {
            if (addressfield1.equals(city)) {
                return city;
            }
            return addressfield1 + ", " + city;
        }
        if (city != null && !city.isBlank()) {
            return city;
        }
        return addressfield1 != null ? addressfield1 : "";
    }

    public Long getId() {
        return id;
    }

    public User getCreator() {
        return creator;
    }

    public void setCreator(User creator) {
        this.creator = creator;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getAddressfield1() {
        return addressfield1;
    }

    public void setAddressfield1(String addressfield1) {
        this.addressfield1 = addressfield1;
        this.location = formatLocation(this.addressfield1, this.city);
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
        this.location = formatLocation(this.addressfield1, this.city);
    }

    public String getLocation() {
        return location != null ? location : formatLocation(addressfield1, city);
    }

    public void setLocation(String location) {
        this.location = location;
        this.addressfield1 = location;
    }

    public Integer getCapacity() {
        return capacity;
    }

    public void setCapacity(Integer capacity) {
        this.capacity = capacity;
    }

    public AgeRestriction getAgeRestriction() {
        return ageRestriction;
    }

    public void setAgeRestriction(AgeRestriction ageRestriction) {
        this.ageRestriction = ageRestriction;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public EventStatus getStatus() {
        return status;
    }

    public void setStatus(EventStatus status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
