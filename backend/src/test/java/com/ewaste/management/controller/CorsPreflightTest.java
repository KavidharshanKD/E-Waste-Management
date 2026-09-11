package com.ewaste.management.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestPropertySource(properties = {
    "app.frontend.url=https://e-waste-management-12b86vv8k-kavidharshankds-projects.vercel.app"
})
class CorsPreflightTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void testCorsPreflightRegisterSuccess() throws Exception {
        String vercelOrigin = "https://e-waste-management-12b86vv8k-kavidharshankds-projects.vercel.app";

        mockMvc.perform(options("/api/auth/register")
                        .header("Origin", vercelOrigin)
                        .header("Access-Control-Request-Method", "POST")
                        .header("Access-Control-Request-Headers", "Content-Type, Authorization"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", vercelOrigin))
                .andExpect(header().string("Access-Control-Allow-Credentials", "true"));
    }
}
