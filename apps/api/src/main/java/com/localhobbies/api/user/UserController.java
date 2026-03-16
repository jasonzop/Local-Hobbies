package com.localhobbies.api.users;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/users")
public class UserController {

    private final UserRepository userRepository;

    public UserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping("/discover")
    public List<User> discoverUsers(
            @RequestParam(required = false) String hobby
    ) {
        if (hobby != null && !hobby.isBlank()) {
            return userRepository.findByHobbiesContainingIgnoreCase(hobby);
        }

        return userRepository.findAll();
    }
}