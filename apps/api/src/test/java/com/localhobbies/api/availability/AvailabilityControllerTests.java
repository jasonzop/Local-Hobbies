package com.localhobbies.api.availability;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class AvailabilityControllerTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private AvailabilityRepository availabilityRepository;

    @BeforeEach
    void clearAvailability() {
        availabilityRepository.deleteAll();
    }

    @Test
    void replacingAWeekPersistsSelectionsAndRemovesClearedSlots() throws Exception {
        mockMvc.perform(post("/me/availability")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "userId": "42",
                                  "date": "2026-10-12",
                                  "startTime": "09:00",
                                  "endTime": "10:00"
                                }
                                """))
                .andExpect(status().isOk());

        mockMvc.perform(put("/me/availability/week")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "userId": "42",
                                  "weekStart": "2026-10-12",
                                  "weekEnd": "2026-10-18",
                                  "slots": [
                                    {
                                      "date": "2026-10-13",
                                      "startTime": "18:00",
                                      "endTime": "19:00"
                                    }
                                  ]
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].date").value("2026-10-13"))
                .andExpect(jsonPath("$[0].startTime").value("18:00:00"));

        mockMvc.perform(get("/me/availability")
                        .queryParam("userId", "42")
                        .queryParam("date", "2026-10-12"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void rejectsSlotsOutsideTheSelectedWeek() throws Exception {
        mockMvc.perform(put("/me/availability/week")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "userId": "42",
                                  "weekStart": "2026-10-12",
                                  "weekEnd": "2026-10-18",
                                  "slots": [
                                    {
                                      "date": "2026-10-19",
                                      "startTime": "18:00",
                                      "endTime": "19:00"
                                    }
                                  ]
                                }
                                """))
                .andExpect(status().isBadRequest());
    }
}
