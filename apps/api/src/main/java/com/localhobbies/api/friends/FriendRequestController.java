package com.localhobbies.api.friends;

import com.localhobbies.api.user.AppUser;
import com.localhobbies.api.user.AppUserRepository;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/friends")
@CrossOrigin(origins = "*")
public class FriendRequestController {

    private final FriendRequestRepository friendRequestRepository;
    private final AppUserRepository appUserRepository;

    public FriendRequestController(
            FriendRequestRepository friendRequestRepository,
            AppUserRepository appUserRepository
    ) {
        this.friendRequestRepository = friendRequestRepository;
        this.appUserRepository = appUserRepository;
    }

    @PostMapping("/request")
    public FriendRequest sendFriendRequest(
            @RequestBody SendFriendRequestBody body
    ) {
        if (body.senderId().equals(body.receiverId())) {
            throw new RuntimeException("Cannot friend yourself");
        }

        boolean alreadyExists =
                friendRequestRepository
                        .existsBySenderIdAndReceiverIdOrSenderIdAndReceiverId(
                                body.senderId(),
                                body.receiverId(),
                                body.receiverId(),
                                body.senderId()
                        );

        if (alreadyExists) {
            throw new RuntimeException("Friend request already exists");
        }

        AppUser sender = appUserRepository.findById(body.senderId())
                .orElseThrow(() -> new RuntimeException("Sender not found"));

        AppUser receiver = appUserRepository.findById(body.receiverId())
                .orElseThrow(() -> new RuntimeException("Receiver not found"));

        FriendRequest request = new FriendRequest(
                sender.getId(),
                receiver.getId()
        );

        return friendRequestRepository.save(request);
    }

    @GetMapping("/incoming")
    public List<FriendRequestResponse> incoming(
            @RequestParam Long userId
    ) {
        return friendRequestRepository
                .findByReceiverIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(request -> {
                    AppUser sender = appUserRepository
                            .findById(request.getSenderId())
                            .orElse(null);

                    return new FriendRequestResponse(
                            request.getId(),
                            request.getSenderId(),
                            sender != null ? sender.getName() : "Unknown",
                            sender != null ? sender.getProfileImageUrl() : null,
                            request.getReceiverId(),
                            request.getStatus()
                    );
                })
                .toList();
    }

    @GetMapping("/outgoing")
    public List<FriendRequestResponse> outgoing(
            @RequestParam Long userId
    ) {
        return friendRequestRepository
                .findBySenderIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(request -> {
                    AppUser receiver = appUserRepository
                            .findById(request.getReceiverId())
                            .orElse(null);

                    return new FriendRequestResponse(
                            request.getId(),
                            request.getSenderId(),
                            receiver != null ? receiver.getName() : "Unknown",
                            receiver != null ? receiver.getProfileImageUrl() : null,
                            request.getReceiverId(),
                            request.getStatus()
                    );
                })
                .toList();
    }

    @PatchMapping("/{id}")
    public FriendRequest updateStatus(
            @PathVariable Long id,
            @RequestBody UpdateFriendRequestBody body
    ) {
        FriendRequest request = friendRequestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Request not found"));

        request.setStatus(body.status());

        return friendRequestRepository.save(request);
    }

    @GetMapping("/status")
    public FriendStatusResponse status(
            @RequestParam Long currentUserId,
            @RequestParam Long otherUserId
    ) {
        boolean exists =
                friendRequestRepository
                        .existsBySenderIdAndReceiverIdOrSenderIdAndReceiverId(
                                currentUserId,
                                otherUserId,
                                otherUserId,
                                currentUserId
                        );

        return new FriendStatusResponse(exists);
    }

    public record SendFriendRequestBody(
            Long senderId,
            Long receiverId
    ) {}

    public record UpdateFriendRequestBody(
            String status
    ) {}

    public record FriendRequestResponse(
            Long id,
            Long senderId,
            String senderName,
            String senderProfileImageUrl,
            Long receiverId,
            String status
    ) {}

    public record FriendStatusResponse(
            boolean exists
    ) {}
}