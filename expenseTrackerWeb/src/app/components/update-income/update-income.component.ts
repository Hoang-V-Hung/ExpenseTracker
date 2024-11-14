import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NzMessageService } from 'ng-zorro-antd/message';
import { IncomeService } from 'src/app/services/income/income.service';
import * as moment from 'moment';

@Component({
  selector: 'app-update-income',
  templateUrl: './update-income.component.html',
  styleUrls: ['./update-income.component.scss']
})
export class UpdateIncomeComponent {
  incomeForm!: FormGroup;
  id: any;
  listOfCategory: any[] = ["Mua sắm", "Du lịch", "Học tập", "Bitcoin", "Chuyển tiền"];
  customCategory: string = '';

  constructor(
    private fb: FormBuilder,
    private incomeService: IncomeService,
    private message: NzMessageService,
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) {
    this.id = this.activatedRoute.snapshot.params['id'];
  }

  ngOnInit() {
    this.incomeForm = this.fb.group({
      title: [null, [Validators.required]],
      amount: [null, [Validators.required]],
      date: [null, [Validators.required, this.dateValidator()]],
      category: [null, [Validators.required]],
      description: [null, [Validators.required]],
    });

    this.getIncomeById();
  }

  submitForm() {
    const selectedDate = moment(this.incomeForm.get('date')?.value);
    const today = moment().startOf('day');
    
    if (selectedDate.isAfter(today)) {
      this.message.error("Không thể cập nhật thu nhập cho ngày trong tương lai!", { nzDuration: 5000 });
      return;
    }

    this.incomeService.updateIncome(this.id, this.incomeForm.value).subscribe(res => {
      this.message.success("Cập nhật thu nhập thành công", { nzDuration: 5000 });
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
}
