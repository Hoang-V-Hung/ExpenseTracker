import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NzMessageService } from 'ng-zorro-antd/message';
import { IncomeService } from 'src/app/services/income/income.service';
import { NzModalService } from 'ng-zorro-antd/modal';
import * as moment from 'moment';

@Component({
  selector: 'app-income',
  templateUrl: './income.component.html',
  styleUrls: ['./income.component.scss']
})
export class IncomeComponent implements OnInit {
  incomes: any;
  incomeForm!: FormGroup;
  listOfCategory: any[] = ["Mua sắm", "Du lịch", "Học tập", "Bitcoin", "Chuyển tiền"];
  customCategory: string = '';
  isListView: boolean = false;
  selectedMonth: number = new Date().getMonth() + 1;
  months = [
    { value: 1, label: 'Tháng 1' },
    { value: 2, label: 'Tháng 2' },
    { value: 3, label: 'Tháng 3' },
    { value: 4, label: 'Tháng 4' },
    { value: 5, label: 'Tháng 5' },
    { value: 6, label: 'Tháng 6' },
    { value: 7, label: 'Tháng 7' },
    { value: 8, label: 'Tháng 8' },
    { value: 9, label: 'Tháng 9' },
    { value: 10, label: 'Tháng 10' },
    { value: 11, label: 'Tháng 11' },
    { value: 12, label: 'Tháng 12' }
  ];
  currentYear: number = new Date().getFullYear();
  showPreviousYears: boolean = false;
  currentYearIncomes: any[] = [];
  previousYearsIncomes: any[] = [];
  selectedYear: number = new Date().getFullYear();
  availableYears: number[] = [];

  constructor(
    private fb: FormBuilder,
    private message: NzMessageService,
    private router: Router,
    private incomeService: IncomeService,
    private modal: NzModalService,
    private route: Router
  ) {
    this.isListView = this.route.url.includes('income-list');
  }

  ngOnInit() {
    this.getAllIncomes();
    this.incomeForm = this.fb.group({
      amount: [null, [Validators.required]],
      date: [null, [Validators.required, this.dateValidator()]],
      category: [null, [Validators.required]],
      description: [null, [Validators.required]],
    })
  }

  submitForm() {
    const selectedDate = moment(this.incomeForm.get('date')?.value);
    const today = moment().startOf('day');
    
    if (selectedDate.isAfter(today)) {
      this.message.error("Không thể thêm thu nhập cho ngày trong tương lai!", { nzDuration: 5000 });
      return;
    }

    this.incomeService.postIncome(this.incomeForm.value).subscribe(res => {
      this.message.success("Thêm thu nhập thành công", { nzDuration: 5000 });
      this.getAllIncomes();
      this.incomeForm.reset();
    }, error => {
      this.message.error("Lỗi", { nzDuration: 5000 });
    })
  }

  getAllIncomes() {
    this.incomeService.getAllIncomes().subscribe(res => {
      this.organizeIncomesByYear(res);
    }, error => {
      this.message.error("Error fetching incomes", { nzDuration: 5000 })
    });
  }

  organizeIncomesByYear(incomes: any[]) {
    // Sắp xếp thu nhập theo ngày giảm dần
    const sortedIncomes = incomes.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    // Tạo danh sách các năm có sẵn
    this.availableYears = Array.from(
      new Set(
        sortedIncomes.map(income => new Date(income.date).getFullYear())
      )
    ).sort((a, b) => b - a);

    // Tạo map để nhóm theo năm và tháng
    const incomesByYear = new Map<number, Map<number, any[]>>();

    sortedIncomes.forEach(income => {
      const date = new Date(income.date);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;

      if (!incomesByYear.has(year)) {
        incomesByYear.set(year, new Map<number, any[]>());
      }
      
      const yearMap = incomesByYear.get(year)!;
      if (!yearMap.has(month)) {
        yearMap.set(month, []);
      }

      yearMap.get(month)!.push(income);
    });

    // Xử lý năm hiện tại
    const currentYearMap = incomesByYear.get(this.selectedYear) || new Map();
    this.currentYearIncomes = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      incomes: currentYearMap.get(i + 1) || []
    }));

    // Xử lý các năm trước
    this.previousYearsIncomes = Array.from(incomesByYear.entries())
      .filter(([year, _]) => year < this.currentYear)
      .map(([year, monthMap]) => ({
        year,
        months: Array.from({ length: 12 }, (_, i) => ({
          month: i + 1,
          incomes: monthMap.get(i + 1) || []
        }))
      }))
      .sort((a, b) => b.year - a.year);
  }

  calculateMonthTotal(incomes: any[]): number {
    return incomes.reduce((sum, income) => sum + Number(income.amount), 0);
  }

  deleteIncome(id: number) {
    this.modal.confirm({
      nzTitle: 'Bạn có muốn xoá thu nhập này?',
      nzOkText: 'Có',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => this.confirmDelete(id),
      nzCancelText: 'Không',
      nzOnCancel: () => console.log('Huỷ')
    });
  }

  confirmDelete(id: number) {
    this.incomeService.deleteIncome(id).subscribe(res => {
      this.message.success("Xoá thu nhập thành công", { nzDuration: 5000 });
      this.getAllIncomes();
    }, error => {
      this.message.error("Lỗi khi xoá thu nhập", { nzDuration: 5000 });
    });
  }

  updateIncome(id: number) {
    this.modal.confirm({
      nzTitle: 'Xác nhận cập nhật',
      nzContent: 'Bạn có muốn cập nhật thu nhập này?',
      nzOkText: 'Có',
      nzOkType: 'primary',
      nzOnOk: () => this.router.navigateByUrl(`/income/${id}/edit`),
      nzCancelText: 'Không',
      nzOnCancel: () => console.log('Cancel')
    });
  }

  addCustomCategory() {
    if (this.customCategory && !this.listOfCategory.includes(this.customCategory)) {
      this.listOfCategory.push(this.customCategory);
      this.incomeForm.patchValue({
        category: this.customCategory
      });
      this.customCategory = '';
    }
  }

  dateValidator() {
    return (control: any) => {
      const selectedDate = moment(control.value);
      const today = moment().startOf('day');
      
      if (selectedDate.isAfter(today)) {
        return { futureDate: true };
      }
      return null;
    };
  }

  onDateChange(event: any) {
    const selectedDate = moment(event);
    const today = moment().startOf('day');
    
    if (selectedDate.isAfter(today)) {
      this.message.warning('Không thể chọn ngày trong tương lai!', {
        nzDuration: 3000
      });
      this.incomeForm.patchValue({
        date: null
      });
    }
  }

  disabledDate = (current: Date): boolean => {
    return current > new Date();
  };

  getCurrentMonthIncomes(): any[] {
    const monthData = this.currentYearIncomes.find(m => m.month === this.selectedMonth);
    return monthData ? monthData.incomes : [];
  }

  onYearChange(year: number) {
    this.selectedYear = year;
    this.getAllIncomes();
  }

  onMonthChange(month: number) {
    this.selectedMonth = month;
  }
}
