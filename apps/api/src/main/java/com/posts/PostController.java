package com.localhobbies.api.posts;

import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/posts")
@CrossOrigin(origins = "*")
public class PostController {

    private final PostRepository postRepository;

    public PostController(PostRepository postRepository) {
        this.postRepository = postRepository;
    }

    @GetMapping
    public List<Post> list(@RequestParam Long userId) {
        return postRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    @PostMapping
    public Post create(@RequestBody CreatePostRequest body) {
        Post post = new Post();
        post.setUserId(body.userId());
        post.setImageUrl(body.imageUrl());
        post.setCaption(body.caption());

        return postRepository.save(post);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable UUID id) {
        postRepository.deleteById(id);
    }

    public record CreatePostRequest(
            Long userId,
            String imageUrl,
            String caption
    ) {}
}