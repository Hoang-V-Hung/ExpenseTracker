package com.example.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.example.service.IncomeService;
import com.example.service.ExpenseService;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/stats")
@RequiredArgsConstructor
public class StatsController {
    
    private final IncomeService incomeService;
    private final ExpenseService expenseService;
    
    @GetMapping
    public ResponseEntity<Map<String, Object>> getStats() {
        try {
            Map<String, Object> stats = new HashMap<>();
            
            // Tính tổng thu nhập
            Double totalIncome = incomeService.calculateTotalIncome();
            stats.put("totalIncome", totalIncome);
            
            // Tính tổng chi phí
            Double totalExpense = expenseService.calculateTotalExpense();
            stats.put("totalExpense", totalExpense);
            
            // Tính số dư
            Double balance = totalIncome - totalExpense;
            stats.put("balance", balance);
            
            // Thêm các thống kê khác nếu cần
            
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Error getting stats: " + e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }
} 