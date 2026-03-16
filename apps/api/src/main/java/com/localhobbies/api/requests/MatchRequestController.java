package com.localhobbies.api.requests;

import com.localhobbies.api.user.AppUserRepository;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

@RestController
public class MatchRequestController {

    private final MatchRequestRepository repo;
    private final AppUserRepository userRepo;

    public MatchRequestController(MatchRequestRepository repo, AppUserRepository userRepo) {
        this.repo = repo;
        this.userRepo = userRepo;
    }

    public record MatchRequestResponse(
            UUID id,
            String senderId,
            String senderName,
            String receiverId,
            String receiverName,
            Long hobbyId,
            LocalDate date,
            LocalTime startTime,
            LocalTime endTime,
            String status
    ) {}

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
    public List<MatchRequestResponse> list(
            @RequestParam String type,
            @RequestParam String userId
    ) {
        if (userId == null || userId.isBlank()) {
            throw new IllegalArgumentException("userId is required");
        }

        List<MatchRequest> requests;

        if ("incoming".equalsIgnoreCase(type)) {
            requests = repo.findByReceiverIdOrderByCreatedAtDesc(userId);
        } else if ("outgoing".equalsIgnoreCase(type)) {
            requests = repo.findBySenderIdOrderByCreatedAtDesc(userId);
        } else {
            throw new IllegalArgumentException("type must be incoming or outgoing");
        }

        return requests.stream().map(r -> {
            String senderName = lookupUserName(r.getSenderId());
            String receiverName = lookupUserName(r.getReceiverId());

            return new MatchRequestResponse(
                    r.getId(),
                    r.getSenderId(),
                    senderName,
                    r.getReceiverId(),
                    receiverName,
                    r.getHobbyId(),
                    r.getDate(),
                    r.getStartTime(),
                    r.getEndTime(),
                    r.getStatus()
            );
        }).toList();
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

    private String lookupUserName(String userId) {
        try {
            Long numericId;

            if (userId.startsWith("u_")) {
                numericId = Long.valueOf(userId.replace("u_", ""));
            } else {
                numericId = Long.valueOf(userId);
            }

            return userRepo.findById(numericId)
                    .map(user -> user.getName())
                    .orElse(userId);
        } catch (Exception e) {
            return userId;
        }
    }
}