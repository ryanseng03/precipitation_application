import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filter'
})
export class FilterPipe implements PipeTransform {

  transform(value: object[], field: string): any {
    console.log(value);
    return value.filter(value => value[field]);
  }

}
