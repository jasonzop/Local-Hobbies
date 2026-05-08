package com.localhobbies.api.friends;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FriendRequestRepository
        extends JpaRepository<FriendRequest, Long> {

    List<FriendRequest> findByReceiverIdOrderByCreatedAtDesc(Long receiverId);

    List<FriendRequest> findBySenderIdOrderByCreatedAtDesc(Long senderId);

    Optional<FriendRequest>
    findBySenderIdAndReceiverId(Long senderId, Long receiverId);

    boolean existsBySenderIdAndReceiverId(
            Long senderId,
            Long receiverId
    );

    boolean existsBySenderIdAndReceiverIdOrSenderIdAndReceiverId(
            Long senderId,
            Long receiverId,
            Long reverseSenderId,
            Long reverseReceiverId
    );
}