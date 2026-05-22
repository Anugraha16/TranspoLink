package com.transpolink.identity.service;

import com.transpolink.identity.config.JwtUtil;
import com.transpolink.identity.dto.*;
import com.transpolink.identity.entity.AuditLog;
import com.transpolink.identity.entity.User;
import com.transpolink.identity.enums.Role;
import com.transpolink.identity.enums.UserStatus;
import com.transpolink.identity.exception.UserAlreadyExistsException;
import com.transpolink.identity.exception.UserNotFoundException;
import com.transpolink.identity.repository.AuditLogRepository;
import com.transpolink.identity.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceImplTest {

    @Mock UserRepository userRepository;
    @Mock AuditLogRepository auditLogRepository;
    @Mock PasswordEncoder passwordEncoder;
    @Mock JwtUtil jwtUtil;

    @InjectMocks UserServiceImpl userService;

    private User user;

    @BeforeEach
    void setUp() {
        user = User.builder()
                .userId(1L).name("Alice").role(Role.CITIZEN)
                .email("alice@test.com").phone("1234567890")
                .password("encoded").status(UserStatus.ACTIVE).build();
    }

    @Test
    void register_citizenAutoApproved() {
        RegisterRequest req = new RegisterRequest();
        req.setName("Alice"); req.setRole(Role.CITIZEN);
        req.setEmail("alice@test.com"); req.setPhone("123"); req.setPassword("pass");

        when(userRepository.existsByEmail("alice@test.com")).thenReturn(false);
        when(passwordEncoder.encode("pass")).thenReturn("encoded");
        when(userRepository.save(any(User.class))).thenReturn(user);
        when(auditLogRepository.save(any(AuditLog.class))).thenReturn(null);

        RegisterResponse response = userService.register(req);

        assertThat(response.getUserId()).isEqualTo(1L);
        assertThat(response.getStatus()).isEqualTo("ACTIVE");
        assertThat(response.getMessage()).contains("log in");
        verify(userRepository).save(any(User.class));
    }

    @Test
    void register_nonCitizenStartsPending() {
        RegisterRequest req = new RegisterRequest();
        req.setName("Bob"); req.setRole(Role.TRAFFIC_OFFICER);
        req.setEmail("bob@test.com"); req.setPhone("456"); req.setPassword("pass");

        User pendingUser = User.builder()
                .userId(2L).name("Bob").role(Role.TRAFFIC_OFFICER)
                .email("bob@test.com").phone("456")
                .password("encoded").status(UserStatus.PENDING).build();

        when(userRepository.existsByEmail("bob@test.com")).thenReturn(false);
        when(passwordEncoder.encode("pass")).thenReturn("encoded");
        when(userRepository.save(any(User.class))).thenReturn(pendingUser);
        when(auditLogRepository.save(any(AuditLog.class))).thenReturn(null);

        RegisterResponse response = userService.register(req);

        assertThat(response.getStatus()).isEqualTo("PENDING");
        assertThat(response.getMessage()).contains("pending");
    }

    @Test
    void register_throwsWhenEmailExists() {
        RegisterRequest req = new RegisterRequest();
        req.setEmail("alice@test.com");
        when(userRepository.existsByEmail("alice@test.com")).thenReturn(true);

        assertThatThrownBy(() -> userService.register(req))
                .isInstanceOf(UserAlreadyExistsException.class);
    }

    @Test
    void register_throwsWhenRoleIsAdmin() {
        RegisterRequest req = new RegisterRequest();
        req.setEmail("admin@test.com"); req.setRole(Role.ADMIN);
        when(userRepository.existsByEmail("admin@test.com")).thenReturn(false);

        assertThatThrownBy(() -> userService.register(req))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void login_success() {
        LoginRequest req = new LoginRequest();
        req.setEmail("alice@test.com"); req.setPassword("pass");

        when(userRepository.findByEmail("alice@test.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("pass", "encoded")).thenReturn(true);
        when(auditLogRepository.save(any(AuditLog.class))).thenReturn(null);
        when(jwtUtil.generateToken(eq("1"), any(Map.class))).thenReturn("token123");

        AuthResponse response = userService.login(req);

        assertThat(response.getToken()).isEqualTo("token123");
        assertThat(response.getUserId()).isEqualTo(1L);
        assertThat(response.getName()).isEqualTo("Alice");
    }

    @Test
    void login_throwsOnInvalidEmail() {
        LoginRequest req = new LoginRequest();
        req.setEmail("wrong@test.com"); req.setPassword("pass");
        when(userRepository.findByEmail("wrong@test.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.login(req))
                .isInstanceOf(UserNotFoundException.class);
    }

    @Test
    void login_throwsOnWrongPassword() {
        LoginRequest req = new LoginRequest();
        req.setEmail("alice@test.com"); req.setPassword("wrong");
        when(userRepository.findByEmail("alice@test.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong", "encoded")).thenReturn(false);

        assertThatThrownBy(() -> userService.login(req))
                .isInstanceOf(UserNotFoundException.class);
    }

    @Test
    void login_throwsWhenPending() {
        user.setStatus(UserStatus.PENDING);
        LoginRequest req = new LoginRequest();
        req.setEmail("alice@test.com"); req.setPassword("pass");
        when(userRepository.findByEmail("alice@test.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("pass", "encoded")).thenReturn(true);

        assertThatThrownBy(() -> userService.login(req))
                .isInstanceOf(UserNotFoundException.class)
                .hasMessageContaining("pending");
    }

    @Test
    void login_throwsWhenSuspended() {
        user.setStatus(UserStatus.SUSPENDED);
        LoginRequest req = new LoginRequest();
        req.setEmail("alice@test.com"); req.setPassword("pass");
        when(userRepository.findByEmail("alice@test.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("pass", "encoded")).thenReturn(true);

        assertThatThrownBy(() -> userService.login(req))
                .isInstanceOf(UserNotFoundException.class)
                .hasMessageContaining("suspended");
    }

    @Test
    void getUserById_success() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        UserResponse response = userService.getUserById(1L);

        assertThat(response.getUserId()).isEqualTo(1L);
        assertThat(response.getEmail()).isEqualTo("alice@test.com");
    }

    @Test
    void getUserById_throwsWhenNotFound() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.getUserById(99L))
                .isInstanceOf(UserNotFoundException.class);
    }

    @Test
    void getAllUsers_returnsList() {
        when(userRepository.findAll()).thenReturn(List.of(user));

        List<UserResponse> result = userService.getAllUsers();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getName()).isEqualTo("Alice");
    }

    @Test
    void approveUser_success() {
        ApprovalRequest req = new ApprovalRequest();
        req.setRole(Role.TRAFFIC_OFFICER);

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenReturn(user);
        when(auditLogRepository.save(any(AuditLog.class))).thenReturn(null);

        UserResponse response = userService.approveUser(1L, req);

        assertThat(response).isNotNull();
        verify(userRepository).save(user);
    }

    @Test
    void approveUser_throwsWhenNotFound() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.approveUser(99L, new ApprovalRequest()))
                .isInstanceOf(UserNotFoundException.class);
    }

    @Test
    void rejectUser_success() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenReturn(user);
        when(auditLogRepository.save(any(AuditLog.class))).thenReturn(null);

        UserResponse response = userService.rejectUser(1L);

        assertThat(response).isNotNull();
        verify(userRepository).save(user);
    }

    @Test
    void updateUser_success() {
        ApprovalRequest req = new ApprovalRequest();
        req.setRole(Role.ADMIN);

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenReturn(user);

        UserResponse response = userService.updateUser(1L, req);

        assertThat(response).isNotNull();
        verify(userRepository).save(user);
    }

    @Test
    void updateUser_throwsWhenNotFound() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.updateUser(99L, new ApprovalRequest()))
                .isInstanceOf(UserNotFoundException.class);
    }

    @Test
    void deleteUser_success() {
        when(userRepository.existsById(1L)).thenReturn(true);
        doNothing().when(userRepository).deleteById(1L);

        userService.deleteUser(1L);

        verify(userRepository).deleteById(1L);
    }

    @Test
    void deleteUser_throwsWhenNotFound() {
        when(userRepository.existsById(99L)).thenReturn(false);

        assertThatThrownBy(() -> userService.deleteUser(99L))
                .isInstanceOf(UserNotFoundException.class);
    }
}
