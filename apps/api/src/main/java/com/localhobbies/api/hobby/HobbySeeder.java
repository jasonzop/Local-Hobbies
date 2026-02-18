package com.localhobbies.api.hobby;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class HobbySeeder implements CommandLineRunner {

    private final HobbyRepository hobbyRepository;

    public HobbySeeder(HobbyRepository hobbyRepository) {
        this.hobbyRepository = hobbyRepository;
    }

    @Override
    public void run(String... args) {
        List<String> seeds = List.of(
                "Music",
                "Tennis",
                "Basketball",
                "Photography",
                "Gym",
                "Gaming",
                "Study Group",
                "Cooking"
        );

        for (String name : seeds) {
            hobbyRepository.findByNameIgnoreCase(name)
                    .orElseGet(() -> hobbyRepository.save(new Hobby(name)));
        }
    }
}
