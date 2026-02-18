package com.localhobbies.api.hobby;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
public class HobbyController {

    private final HobbyRepository hobbyRepository;

    public HobbyController(HobbyRepository hobbyRepository) {
        this.hobbyRepository = hobbyRepository;
    }

    @GetMapping("/hobbies")
    public List<Hobby> list() {
        return hobbyRepository.findAll();
    }
}
