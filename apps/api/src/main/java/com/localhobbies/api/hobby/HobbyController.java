package com.localhobbies.api.hobby;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/hobbies")
@CrossOrigin(origins = "*")
public class HobbyController {

    private final HobbyRepository hobbyRepository;

    public HobbyController(HobbyRepository hobbyRepository) {
        this.hobbyRepository = hobbyRepository;
    }

    @GetMapping
    public List<Hobby> list() {
        return hobbyRepository.findAll()
                .stream()
                .sorted((a, b) ->
                        a.getName().compareToIgnoreCase(b.getName()))
                .toList();
    }

    @PostMapping
    public Hobby create(@RequestBody HobbyBody body) {
        String cleaned = body.name() == null
                ? ""
                : body.name().trim();

        if (cleaned.isBlank()) {
            throw new RuntimeException("Hobby name required");
        }

        return hobbyRepository
                .findByNameIgnoreCase(cleaned)
                .orElseGet(() ->
                        hobbyRepository.save(new Hobby(cleaned)));
    }

    public record HobbyBody(String name) {}
}