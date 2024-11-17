import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DateService {
  disableFutureDate = (current: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const currentDate = new Date(current);
    currentDate.setHours(0, 0, 0, 0);
    
    return currentDate.getTime() >= today.getTime();
  };
} 