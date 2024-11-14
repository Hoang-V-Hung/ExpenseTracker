@Entity
public class Expense {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private BigDecimal amount;
    private LocalDate date;
    private String category;
    private String description;
    
    // getters and setters
} 