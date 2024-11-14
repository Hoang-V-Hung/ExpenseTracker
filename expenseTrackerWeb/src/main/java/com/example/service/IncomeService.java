package com.example.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import com.example.repository.IncomeRepository;

@Service
@RequiredArgsConstructor
public class IncomeService {
    
    private final IncomeRepository incomeRepository;
    
    public Double calculateTotalIncome() {
        return incomeRepository.findAll().stream()
            .mapToDouble(income -> income.getAmount().doubleValue())
            .sum();
    }
    
    // ... các phương thức khác
} 