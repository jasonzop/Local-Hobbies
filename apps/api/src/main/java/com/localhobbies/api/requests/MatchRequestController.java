package com.localhobbies.api.requests;

import com.localhobbies.api.user.AppUserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import com.localhobbies.api.hobby.HobbyRepository;
import com.localhobbies.api.hobby.Hobby;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

@RestController
@CrossOrigin(origins = "*")
public class MatchRequestController {

    private final MatchRequestRepository repo;
    private final AppUserRepository userRepo;
    private final HobbyRepository hobbyRepo;

   public MatchRequestController(
        MatchRequestRepository repo,
        AppUserRepository userRepo,
        HobbyRepository hobbyRepo
) {
    this.repo = repo;
    this.userRepo = userRepo;
    this.hobbyRepo = hobbyRepo;
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
        String senderProfileImageUrl,
        Long receiverId,
        String receiverName,
        String receiverProfileImageUrl,
        Long hobbyId,
        String hobbyName,
        LocalDate date,
        LocalTime startTime,
        LocalTime endTime,
        String status
) {}

    @PostMapping("/requests")
    public MatchRequestResponse send(@RequestBody SendRequestBody body) {
        if (body.senderId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "senderId is required");
        }

        if (body.receiverId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "receiverId is required");
        }

        if (body.hobbyId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "hobbyId is required");
        }

        if (body.date() == null || body.date().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "date is required");
        }

        if (body.startTime() == null || body.startTime().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "startTime is required");
        }

        if (body.endTime() == null || body.endTime().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "endTime is required");
        }

        LocalDate date = LocalDate.parse(body.date());
        LocalTime startTime = LocalTime.parse(body.startTime());
        LocalTime endTime = LocalTime.parse(body.endTime());

        boolean exists = repo.existsBySenderIdAndReceiverIdAndDateAndStartTimeAndEndTime(
                body.senderId(),
                body.receiverId(),
                date,
                startTime,
                endTime
        );

        if (exists) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Request already sent for this time slot"
            );
        }

        MatchRequest r = new MatchRequest();
        r.setSenderId(body.senderId());
        r.setReceiverId(body.receiverId());
        r.setHobbyId(body.hobbyId());
        r.setDate(date);
        r.setStartTime(startTime);
        r.setEndTime(endTime);
        r.setStatus("pending");

        return toResponse(repo.save(r));
    }

    @GetMapping("/me/requests")
    public List<MatchRequestResponse> getRequests(
            @RequestParam String type,
            @RequestParam Long userId
    ) {
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "userId is required");
        }

        List<MatchRequest> requests;

        if ("incoming".equalsIgnoreCase(type)) {
            requests = repo.findByReceiverIdOrderByCreatedAtDesc(userId);
        } else if ("outgoing".equalsIgnoreCase(type)) {
            requests = repo.findBySenderIdOrderByCreatedAtDesc(userId);
        } else {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "type must be incoming or outgoing"
            );
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
        MatchRequest r = repo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Request not found"));

        if (body.status() == null || body.status().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "status is required");
        }

        r.setStatus(body.status().toLowerCase());
        return toResponse(repo.save(r));
    }

    @DeleteMapping("/requests/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        if (!repo.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Request not found");
        }

        repo.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private MatchRequestResponse toResponse(MatchRequest r) {
        return new MatchRequestResponse(
                r.getId(),
                r.getSenderId(),
                lookupUserName(r.getSenderId()),
                lookupUserImage(r.getSenderId()),
                r.getReceiverId(),
                lookupUserName(r.getReceiverId()),
                lookupUserImage(r.getReceiverId()),
                r.getHobbyId(),
                lookupHobbyName(r.getHobbyId()),
            r.getDate(),
                r.getStartTime(),
                r.getEndTime(),
                r.getStatus()
        );
    }

    private String lookupUserName(Long userId) {
        if (userId == null) {
            return "Unknown user";
        }

        return userRepo.findById(userId)
                .map(user -> {
                    String name = user.getName();

                    if (name != null && !name.isBlank()) {
                        return name;
                    }

                    String email = user.getEmail();

                    if (email != null && !email.isBlank()) {
                        return email;
                    }

                    return "User " + userId;
                })
                .orElse("User " + userId);
    }

    private String lookupUserImage(Long userId) {
        if (userId == null) {
            return "";
        }

        return userRepo.findById(userId)
                .map(user -> {
                    String url = user.getProfileImageUrl();

                    if (url != null && !url.isBlank()) {
                        return url;
                    }

                    return "";
                })
                .orElse("");
    }

    private String lookupHobbyName(Long hobbyId) {
    if (hobbyId == null) {
        return "Unknown hobby";
    }

    return hobbyRepo.findById(hobbyId)
            .map(Hobby::getName)
            .orElse("Unknown hobby");
}
}