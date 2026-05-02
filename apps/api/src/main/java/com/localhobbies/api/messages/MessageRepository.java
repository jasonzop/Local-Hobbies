package com.localhobbies.api.messages;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface MessageRepository extends JpaRepository<Message, UUID> {

    List<Message> findBySenderIdAndReceiverIdOrderByCreatedAtAsc(Long senderId, Long receiverId);

    List<Message> findByReceiverIdAndSenderIdOrderByCreatedAtAsc(Long receiverId, Long senderId);
}