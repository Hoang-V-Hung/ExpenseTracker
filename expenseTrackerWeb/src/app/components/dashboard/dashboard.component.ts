import { Component, ElementRef, ViewChild } from '@angular/core';
import { StatsService } from 'src/app/services/stats/stats.service';
import Chart from 'chart.js/auto';
import { CategoryScale } from 'chart.js';
import { NzMessageService } from 'ng-zorro-antd/message';

Chart.register(CategoryScale);


@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent {

  stats:any;
  expenses:any;
  incomes:any;

  gridStyle = {
    width: '25%',
    textAlign: 'center'
  };

  @ViewChild('incomeLineChartRef') private incomeLineChartRef:ElementRef;
  @ViewChild('expenseLineChartRef') private expenseLineChartRef:ElementRef;


  constructor(
    private statsService: StatsService,
    private message: NzMessageService
  ){
    this.getStats();
    this.getChartData();
  }

  createLineChart(){
    const incomeCtx = this.incomeLineChartRef.nativeElement.getContext('2d');

    const reversedIncomes = [...this.incomes].reverse();

    new Chart(incomeCtx, {
      type: 'line',
      data: {
        labels: reversedIncomes.map(income => income.date),
        datasets: [{
          label: 'Thu nhập',
          data: reversedIncomes.map(income => income.amount),
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

    const expenseCtx = this.expenseLineChartRef.nativeElement.getContext('2d');

    const reversedExpenses = [...this.expenses].reverse();

    new Chart(expenseCtx, {
      type: 'line',
      data: {
        labels: reversedExpenses.map(expense => expense.date),
        datasets: [{
          label: 'Chi phí',
          data: reversedExpenses.map(expense => expense.amount),
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

  getStats(){
    this.statsService.getStats().subscribe(res=>{
      console.log(res);
      this.stats = res;
      
      if (this.stats?.expense > this.stats?.income) {
        this.message.warning('Chi phí vượt quá thu nhập!', {
          nzDuration: 5000
        });
      }
    })
  }

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
