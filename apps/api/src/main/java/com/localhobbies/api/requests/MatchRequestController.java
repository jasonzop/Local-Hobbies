package com.localhobbies.api.requests;

import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

@RestController
public class MatchRequestController {

    private final MatchRequestRepository repo;

    public MatchRequestController(MatchRequestRepository repo) {
        this.repo = repo;
    }

    @PostMapping("/requests")
    public MatchRequest send(@RequestBody SendRequestBody body) {
        if (body.senderId == null || body.senderId.isBlank()) {
            throw new IllegalArgumentException("senderId is required");
        }

        if (body.receiverId == null || body.receiverId.isBlank()) {
            throw new IllegalArgumentException("receiverId is required");
        }

        if (body.hobbyId == null) {
            throw new IllegalArgumentException("hobbyId is required");
        }

        if (body.date == null || body.date.isBlank()) {
            throw new IllegalArgumentException("date is required");
        }

        if (body.startTime == null || body.startTime.isBlank()) {
            throw new IllegalArgumentException("startTime is required");
        }

        if (body.endTime == null || body.endTime.isBlank()) {
            throw new IllegalArgumentException("endTime is required");
        }

        MatchRequest r = new MatchRequest();
        r.setSenderId(body.senderId);
        r.setReceiverId(body.receiverId);
        r.setHobbyId(body.hobbyId);
        r.setDate(LocalDate.parse(body.date));
        r.setStartTime(LocalTime.parse(body.startTime));
        r.setEndTime(LocalTime.parse(body.endTime));
        r.setStatus("pending");

        return repo.save(r);
    }

    @GetMapping("/me/requests")
    public List<MatchRequest> list(
            @RequestParam String type,
            @RequestParam String userId
    ) {
        if (userId == null || userId.isBlank()) {
            throw new IllegalArgumentException("userId is required");
        }

        if ("incoming".equalsIgnoreCase(type)) {
            return repo.findByReceiverIdOrderByCreatedAtDesc(userId);
        }

        if ("outgoing".equalsIgnoreCase(type)) {
            return repo.findBySenderIdOrderByCreatedAtDesc(userId);
        }

        throw new IllegalArgumentException("type must be incoming or outgoing");
    }

    @PatchMapping("/requests/{id}")
    public MatchRequest update(
            @PathVariable UUID id,
            @RequestBody UpdateRequestStatusBody body
    ) {
        MatchRequest r = repo.findById(id).orElseThrow();

        if (body.status == null || body.status.isBlank()) {
            throw new IllegalArgumentException("status is required");
        }

        r.setStatus(body.status.toLowerCase());
        return repo.save(r);
    }
}