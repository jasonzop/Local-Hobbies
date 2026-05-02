package com.localhobbies.api.messages;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@CrossOrigin(origins = "*")
public class MessageController {

    private final MessageRepository repo;

    public MessageController(MessageRepository repo) {
        this.repo = repo;
    }

    @PostMapping("/messages")
    public Message send(@RequestBody Message m) {
        return repo.save(m);
    }

    @GetMapping("/messages")
    public List<Message> getChat(
            @RequestParam Long user1,
            @RequestParam Long user2
    ) {
        List<Message> a = repo.findBySenderIdAndReceiverIdOrderByCreatedAtAsc(user1, user2);
        List<Message> b = repo.findByReceiverIdAndSenderIdOrderByCreatedAtAsc(user1, user2);

        a.addAll(b);
        a.sort((x, y) -> x.getCreatedAt().compareTo(y.getCreatedAt()));

        return a;
    }
}