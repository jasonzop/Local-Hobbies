package com.localhobbies.api.requests;

import com.localhobbies.api.user.AppUserRepository;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

@RestController
@CrossOrigin(origins = "*")
public class MatchRequestController {

    private final MatchRequestRepository repo;
    private final AppUserRepository userRepo;

    public MatchRequestController(
            MatchRequestRepository repo,
            AppUserRepository userRepo
    ) {
        this.repo = repo;
        this.userRepo = userRepo;
    }

    public record SendRequestBody(
            Long senderId,
            Long receiverId,
            Long hobbyId,
            String date,
            String startTime,
            String endTime
    ) {}

    public record UpdateRequestStatusBody(String status) {}

    public record MatchRequestResponse(
            UUID id,
            Long senderId,
            String senderName,
            Long receiverId,
            String receiverName,
            Long hobbyId,
            LocalDate date,
            LocalTime startTime,
            LocalTime endTime,
            String status
    ) {}

    @PostMapping("/requests")
    public MatchRequestResponse send(@RequestBody SendRequestBody body) {
        boolean exists = repo.existsBySenderIdAndReceiverIdAndDateAndStartTimeAndEndTime(
        body.senderId(),
        body.receiverId(),
        LocalDate.parse(body.date()),
        LocalTime.parse(body.startTime()),
        LocalTime.parse(body.endTime())
);

if (exists) {
    throw new RuntimeException("Request already sent for this time slot");
}
        if (body.senderId() == null) {
            throw new IllegalArgumentException("senderId is required");
        }

        if (body.receiverId() == null) {
            throw new IllegalArgumentException("receiverId is required");
        }

        if (body.hobbyId() == null) {
            throw new IllegalArgumentException("hobbyId is required");
        }

        if (body.date() == null || body.date().isBlank()) {
            throw new IllegalArgumentException("date is required");
        }

        if (body.startTime() == null || body.startTime().isBlank()) {
            throw new IllegalArgumentException("startTime is required");
        }

        if (body.endTime() == null || body.endTime().isBlank()) {
            throw new IllegalArgumentException("endTime is required");
        }

        MatchRequest r = new MatchRequest();
        r.setSenderId(body.senderId());
        r.setReceiverId(body.receiverId());
        r.setHobbyId(body.hobbyId());
        r.setDate(LocalDate.parse(body.date()));
        r.setStartTime(LocalTime.parse(body.startTime()));
        r.setEndTime(LocalTime.parse(body.endTime()));
        r.setStatus("pending");

        return toResponse(repo.save(r));
    }

    @GetMapping("/me/requests")
    public List<MatchRequestResponse> getRequests(
            @RequestParam String type,
            @RequestParam Long userId
    ) {
        if (userId == null) {
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

        return requests.stream()
                .map(this::toResponse)
                .toList();
    }

    @PatchMapping("/requests/{id}")
    public MatchRequestResponse update(
            @PathVariable UUID id,
            @RequestBody UpdateRequestStatusBody body
    ) {
        MatchRequest r = repo.findById(id).orElseThrow();

        if (body.status() == null || body.status().isBlank()) {
            throw new IllegalArgumentException("status is required");
        }

        r.setStatus(body.status().toLowerCase());
        return toResponse(repo.save(r));
    }

    private MatchRequestResponse toResponse(MatchRequest r) {
        return new MatchRequestResponse(
                r.getId(),
                r.getSenderId(),
                lookupUserName(r.getSenderId()),
                r.getReceiverId(),
                lookupUserName(r.getReceiverId()),
                r.getHobbyId(),
                r.getDate(),
                r.getStartTime(),
                r.getEndTime(),
                r.getStatus()
        );
    }

    private String lookupUserName(Long userId) {
        if (userId == null) {
            return "";
        }

        return userRepo.findById(userId)
                .map(user -> user.getName())
                .orElse(String.valueOf(userId));
    }
}