export interface ReviewContext {
  name1: string;
  documentno: string;
  date_interment: string;

  // Single occupant (legacy, optional)
  occupant?: string;

  // Multiple occupants (new)
  occupantNames?: string[];
}
