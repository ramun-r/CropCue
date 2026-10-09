package com.cropcue.backend.insight;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(InsightController.class)
class InsightControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void receivesGetInsightAction() throws Exception {
        mockMvc.perform(post("/api/get_insight")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"fieldId":"field-02"}
                                """))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.action").value("get_insight"))
                .andExpect(jsonPath("$.fieldId").value("field-02"))
                .andExpect(jsonPath("$.insight").isString());
    }
}
