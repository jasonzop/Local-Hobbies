package com.localhobbies.api.users;

import com.localhobbies.api.user.AppUser;
import com.localhobbies.api.user.AppUserRepository;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/users")
@CrossOrigin(origins = "*")
public class UserController {

    private final AppUserRepository appUserRepository;

    public UserController(AppUserRepository appUserRepository) {
        this.appUserRepository = appUserRepository;
    }

    @GetMapping("/discover")
    public List<DiscoverUserResponse> discoverUsers() {
        return appUserRepository.findAll().stream()
                .map(user -> new DiscoverUserResponse(
                        user.getId(),
                        user.getName(),
                        user.getEmail()
                ))
                .toList();
    }

    public record DiscoverUserResponse(
            Long id,
            String name,
            String email
    ) {}
}