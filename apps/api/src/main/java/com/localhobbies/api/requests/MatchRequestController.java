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
        MatchRequest r = new MatchRequest();
        r.setSenderKey("me");
        r.setReceiverId(body.receiverId);
        r.setHobbyId(body.hobbyId);
        r.setDate(LocalDate.parse(body.date));
        r.setStartTime(LocalTime.parse(body.startTime));
        r.setEndTime(LocalTime.parse(body.endTime));
        r.setStatus("pending");
        return repo.save(r);
    }

    // type=incoming|outgoing (incoming uses receiverId="me" for now)
    @GetMapping("/me/requests")
    public List<MatchRequest> list(@RequestParam String type) {
        if ("incoming".equalsIgnoreCase(type)) {
            return repo.findByReceiverIdOrderByCreatedAtDesc("me");
        }
        return repo.findBySenderKeyOrderByCreatedAtDesc("me");
    }

    @PatchMapping("/requests/{id}")
    public MatchRequest update(@PathVariable UUID id, @RequestBody UpdateRequestStatusBody body) {
        MatchRequest r = repo.findById(id).orElseThrow();
        r.setStatus(body.status);
        return repo.save(r);
    }
}
