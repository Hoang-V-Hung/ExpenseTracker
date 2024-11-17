import { Component, ElementRef, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { StatsService } from 'src/app/services/stats/stats.service';
import Chart from 'chart.js/auto';
import { CategoryScale } from 'chart.js';
import { NzMessageService } from 'ng-zorro-antd/message';
import { Subscription } from 'rxjs';

Chart.register(CategoryScale);

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {

  stats:any;
  expenses:any;
  incomes:any;
  recentTransactions: any[] = [];
  private subscription: Subscription;

  gridStyle = {
    width: '25%',
    textAlign: 'center'
  };

  @ViewChild('incomeLineChartRef') private incomeLineChartRef:ElementRef;
  @ViewChild('expenseLineChartRef') private expenseLineChartRef:ElementRef;


  constructor(
    private statsService: StatsService,
    private message: NzMessageService
  ) {}

  ngOnInit() {
    this.getStats();
    this.getChartData();

    // Subscribe to refresh events
    this.subscription = this.statsService.refresh$.subscribe(() => {
      this.getStats();
      this.getChartData();
    });
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

//tạo biểu đồ
  createLineChart(){
    const incomeCtx = this.incomeLineChartRef.nativeElement.getContext('2d');
    const expenseCtx = this.expenseLineChartRef.nativeElement.getContext('2d');

    // Sort data chronologically
    const sortedIncomes = [...this.incomes].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const sortedExpenses = [...this.expenses].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    new Chart(incomeCtx, {
      type: 'line',
      data: {
        labels: sortedIncomes.map(income => income.date),
        datasets: [{
          label: 'Thu nhập',
          data: sortedIncomes.map(income => income.amount),
          borderWidth: 1,
          backgroundColor: 'rgb(80, 200, 120)',
          borderColor: 'rgb(0, 100, 0)',
        }]
      },
      options: {
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });

    new Chart(expenseCtx, {
      type: 'line',
      data: {
        labels: sortedExpenses.map(expense => expense.date),
        datasets: [{
          label: 'Chi phí',
          data: sortedExpenses.map(expense => expense.amount),
          borderWidth: 1,
          backgroundColor: 'rgb(255, 0, 0)',
          borderColor: 'rgb(255,0 , 0)',
        }]
      },
      options: {
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  }

// lấy dữ liệu kiểm tra thu nhập và chi phí
  getStats() {
    this.statsService.getStats().subscribe(res => {
      // Sắp xếp lịch sử theo thời gian mới nhất
      if (res.lastIncome) {
        res.lastIncome = {
          ...res.lastIncome,
          date: new Date(res.lastIncome.date)
        };
      }
      
      if (res.lastExpense) {
        res.lastExpense = {
          ...res.lastExpense,
          date: new Date(res.lastExpense.date)
        };
      }

      // Sắp xếp để hiển thị giao dịch mới nhất lên đầu
      const transactions = [];
      if (res.lastIncome) transactions.push({...res.lastIncome, type: 'income'});
      if (res.lastExpense) transactions.push({...res.lastExpense, type: 'expense'});
      
      transactions.sort((a, b) => b.date.getTime() - a.date.getTime());
      
      res.lastIncome = transactions.find(t => t.type === 'income');
      res.lastExpense = transactions.find(t => t.type === 'expense');

      this.stats = res;
      
      if (this.stats?.expense > this.stats?.income) {
        this.message.warning('Chi phí vượt quá thu nhập!');
      }
    });
  }

// cập nhật data và tạo biểu đồ
  getChartData(){
    this.statsService.getChart().subscribe(res=>{
      if(res.expenseList != null && res.incomeList != null){
        this.incomes = res.incomeList;
        this.expenses = res.expenseList;
        console.log(res);

        this.createLineChart();
      }
    })
  }

}
