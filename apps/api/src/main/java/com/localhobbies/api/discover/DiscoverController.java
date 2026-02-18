package com.localhobbies.api.discover;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
public class DiscoverController {

    @GetMapping("/discover")
    public List<DiscoverResult> discover(
            @RequestParam Long hobbyId,
            @RequestParam String date,
            @RequestParam String start,
            @RequestParam String end
    ) {
        // MVP mock results (frontend can integrate right now)
        return List.of(
                new DiscoverResult("u_101", "Aisha", "Into music + photography. Free around evenings.", 0.7),
                new DiscoverResult("u_102", "Kevin", "Tennis + gym. Down to practice weekly.", 1.4),
                new DiscoverResult("u_103", "Sam", "Study group / coding sessions.", 2.1)
        );
    }
}
