import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NzMessageService } from 'ng-zorro-antd/message';
import { IncomeService } from 'src/app/services/income/income.service';
import * as moment from 'moment';
import { StatsService } from 'src/app/services/stats/stats.service';

@Component({
  selector: 'app-update-income',
  templateUrl: './update-income.component.html',
  styleUrls: ['./update-income.component.scss']
})
export class UpdateIncomeComponent implements OnInit {
  incomeForm!: FormGroup;
  id: any;
  listOfCategory: string[] = [];
  currentInputValue: string = '';

  constructor(
    private fb: FormBuilder,
    private incomeService: IncomeService,
    private message: NzMessageService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private statsService: StatsService
  ) {
    this.id = this.activatedRoute.snapshot.params['id'];
  }

  ngOnInit() {
    this.incomeForm = this.fb.group({
      amount: [null, [Validators.required]],
      date: [moment().startOf('day').toDate(), [Validators.required]],
      category: [null, [Validators.required]],
      description: [null, [Validators.required]]
    });

    this.getIncomeById();
  }

  onCategoryChange(value: string) {
    if (value && value !== this.incomeForm.get('category')?.value) {
      this.incomeForm.get('category')?.setValue(value, { emitEvent: false });
      this.currentInputValue = value;
    }
  }

  onCategorySearch(value: string) {
    if (value?.trim()) {
      this.currentInputValue = value.trim();
    }
  }

  onCategoryKeyEnter() {
    if (this.currentInputValue?.trim()) {
      const newValue = this.currentInputValue.trim();
      
      const existingCategory = this.listOfCategory.find(
        cat => cat.toLowerCase() === newValue.toLowerCase()
      );

      if (!existingCategory) {
        this.listOfCategory = [newValue, ...this.listOfCategory];
      }

      this.incomeForm.get('category')?.setValue(newValue, { emitEvent: false });
    }
  }

  submitForm() {
    const selectedDate = moment(this.incomeForm.get('date')?.value).startOf('day');
    const today = moment().endOf('day');
    
    if (selectedDate.isAfter(today)) {
      this.message.error("Không thể cập nhật thu nhập cho ngày trong tương lai!", { nzDuration: 5000 });
      return;
    }

    const formValue = { ...this.incomeForm.value };
    formValue.date = moment(formValue.date).format('YYYY-MM-DD');

    this.incomeService.updateIncome(this.id, formValue).subscribe(res => {
      this.message.success("Cập nhật thu nhập thành công", { nzDuration: 5000 });
      this.statsService.refreshStats();
      this.router.navigateByUrl('/income-list');
    }, error => {
      this.message.error("Lỗi khi cập nhật thu nhập", { nzDuration: 5000 });
    });
  }

  getIncomeById() {
    this.incomeService.getIncomeById(this.id).subscribe(res => {
      this.incomeForm.patchValue(res);
    }, error => {
      this.message.error("Lỗi", { nzDuration: 5000 });
    });
  }

  dateValidator() {
    return (control: any) => {
      const selectedDate = moment(control.value);
      const today = moment().endOf('day');
      
      if (selectedDate.isAfter(today)) {
        return { futureDate: true };
      }
      return null;
    };
  }

  onDateChange(event: any) {
    const selectedDate = moment(event);
    const today = moment().endOf('day');
    
    if (selectedDate.isAfter(today)) {
      this.message.warning('Không thể chọn ngày trong tương lai!', {
        nzDuration: 3000
      });
      this.incomeForm.patchValue({
        date: moment().startOf('day').toDate()
      });
    }
  }

  disabledDate = (current: Date): boolean => {
    return current > new Date();
  };
}
