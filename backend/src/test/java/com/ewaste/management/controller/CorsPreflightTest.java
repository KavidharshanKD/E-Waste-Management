package com.ewaste.management.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestPropertySource(properties = {
    "app.frontend.url=https://e-waste-management-eight-indol.vercel.app"
})
class CorsPreflightTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void testCorsPreflightRegisterProductionOriginSuccess() throws Exception {
        String productionOrigin = "https://e-waste-management-eight-indol.vercel.app";

        mockMvc.perform(options("/api/auth/register")
                        .header("Origin", productionOrigin)
                        .header("Access-Control-Request-Method", "POST")
                        .header("Access-Control-Request-Headers", "content-type"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", productionOrigin))
                .andExpect(header().string("Access-Control-Allow-Credentials", "true"))
                .andExpect(header().string("Access-Control-Allow-Methods", containsString("POST")));
    }

    @Test
    void testCorsPreflightRegisterPreviewOriginSuccess() throws Exception {
        String previewOrigin = "https://e-waste-management-12b86vv8k-kavidharshankds-projects.vercel.app";

        mockMvc.perform(options("/api/auth/register")
                        .header("Origin", previewOrigin)
                        .header("Access-Control-Request-Method", "POST")
                        .header("Access-Control-Request-Headers", "content-type"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", previewOrigin))
                .andExpect(header().string("Access-Control-Allow-Credentials", "true"));
    }

    @Test
    void testCorsPreflightRegisterLocalhostSuccess() throws Exception {
        String localOrigin = "http://localhost:5173";

        mockMvc.perform(options("/api/auth/register")
                        .header("Origin", localOrigin)
                        .header("Access-Control-Request-Method", "POST")
                        .header("Access-Control-Request-Headers", "content-type"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", localOrigin))
                .andExpect(header().string("Access-Control-Allow-Credentials", "true"));
    }
}
