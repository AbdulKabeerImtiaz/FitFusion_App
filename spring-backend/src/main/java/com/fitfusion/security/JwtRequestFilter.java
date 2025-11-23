package com.fitfusion.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class JwtRequestFilter extends OncePerRequestFilter {

    private final CustomUserDetailsService userDetailsService;
    private final JwtUtil jwtUtil;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {

        System.out.println("🔍 JWT FILTER: Processing request: " + request.getMethod() + " " + request.getRequestURI());
        final String authorizationHeader = request.getHeader("Authorization");
        System.out.println("🔍 JWT FILTER: Authorization Header: " + (authorizationHeader != null
                ? "Present (" + authorizationHeader.substring(0, Math.min(20, authorizationHeader.length())) + "...)"
                : "MISSING"));

        String username = null;
        String jwt = null;

        if (authorizationHeader != null && authorizationHeader.startsWith("Bearer ")) {
            jwt = authorizationHeader.substring(7);
            try {
                username = jwtUtil.extractUsername(jwt);
                System.out.println("🔍 JWT FILTER: JWT token found for user: " + username);
            } catch (Exception e) {
                System.out.println("❌ JWT FILTER: JWT token extraction failed: " + e.getMessage());
                e.printStackTrace();
            }
        } else {
            System.out.println("⚠️  JWT FILTER: No Bearer token found in Authorization header");
        }

        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            UserDetails userDetails = this.userDetailsService.loadUserByUsername(username);
            System.out.println("🔍 JWT FILTER: Loaded user details for: " + username + ", authorities: "
                    + userDetails.getAuthorities());

            if (jwtUtil.validateToken(jwt, userDetails)) {
                UsernamePasswordAuthenticationToken authenticationToken = new UsernamePasswordAuthenticationToken(
                        userDetails, null, userDetails.getAuthorities());
                authenticationToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authenticationToken);
                System.out.println("✅ JWT FILTER: Successfully authenticated user: " + username + " with authorities: "
                        + userDetails.getAuthorities());
            } else {
                System.out.println("❌ JWT FILTER: JWT token validation failed for user: " + username);
            }
        }
        chain.doFilter(request, response);
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return path.startsWith("/api/auth/") || path.equals("/actuator/health");
    }
}
