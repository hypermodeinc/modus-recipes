/**
 *  CSV specifications. A CSV specification is

- a file name
- a header structure: a string (comma separated)
- a row example: a string (comma separated)
 */

@json
export class CsvSpec {
  fileName!: string;
  headerStructure!: string;
  rowExample!: string;
}
