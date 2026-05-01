package com.localhobbies.api.requests;

import jakarta.persistence.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "match_requests")
public class MatchRequest {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(nullable = false)
    private Long senderId;

    @Column(nullable = false)
    private Long receiverId;

    @Column(nullable = false)
    private Long hobbyId;

    @Column(nullable = false)
    private LocalDate date;

    @Column(nullable = false)
    private LocalTime startTime;

    @Column(nullable = false)
    private LocalTime endTime;

    @Column(nullable = false)
    private String status = "pending";

    @Column(nullable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    public MatchRequest() {}

    public UUID getId() { return id; }

    public Long getSenderId() { return senderId; }

    public Long getReceiverId() { return receiverId; }

    public Long getHobbyId() { return hobbyId; }

    public LocalDate getDate() { return date; }

    public LocalTime getStartTime() { return startTime; }

    public LocalTime getEndTime() { return endTime; }

    public String getStatus() { return status; }

    public OffsetDateTime getCreatedAt() { return createdAt; }

    public void setId(UUID id) { this.id = id; }

    public void setSenderId(Long senderId) { this.senderId = senderId; }

    public void setReceiverId(Long receiverId) { this.receiverId = receiverId; }

    public void setHobbyId(Long hobbyId) { this.hobbyId = hobbyId; }

    public void setDate(LocalDate date) { this.date = date; }

    public void setStartTime(LocalTime startTime) { this.startTime = startTime; }

    public void setEndTime(LocalTime endTime) { this.endTime = endTime; }

    public void setStatus(String status) { this.status = status; }

    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}