package com.ewaste.management.dto;

public class JwtAuthResponse {
    private String accessToken;
    private String tokenType = "Bearer";
    private UserDTO user;

    public JwtAuthResponse() {}

    public JwtAuthResponse(String accessToken, UserDTO user) {
        this.accessToken = accessToken;
        this.user = user;
    }

    public String getAccessToken() { return accessToken; }
    public void setAccessToken(String accessToken) { this.accessToken = accessToken; }

    public String getTokenType() { return tokenType; }
    public void setTokenType(String tokenType) { this.tokenType = tokenType; }

    public UserDTO getUser() { return user; }
    public void setUser(UserDTO user) { this.user = user; }
}
