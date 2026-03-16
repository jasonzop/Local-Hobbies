package com.localhobbies.api.discover;

import com.localhobbies.api.user.AppUser;
import com.localhobbies.api.user.AppUserRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
public class DiscoverController {

    private final AppUserRepository appUserRepository;

    public DiscoverController(AppUserRepository appUserRepository) {
        this.appUserRepository = appUserRepository;
    }

    @GetMapping("/users/discover")
    public List<AppUser> discoverUsers() {
        return appUserRepository.findAll();
    }
}