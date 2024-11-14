package com.example.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import com.example.repository.ExpenseRepository;

@Service
@RequiredArgsConstructor
public class ExpenseService {
    
    private final ExpenseRepository expenseRepository;
    
    public Double calculateTotalExpense() {
        return expenseRepository.findAll().stream()
            .mapToDouble(expense -> expense.getAmount().doubleValue())
            .sum();
    }
    
    // ... các phương thức khác
} 