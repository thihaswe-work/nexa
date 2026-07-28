import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Pagination } from '../pagination';

describe('Pagination', () => {
  const baseProps = {
    page: 1,
    pageSize: 25,
    total: 100,
    onPageChange: jest.fn(),
  };

  it('renders total count', () => {
    render(<Pagination {...baseProps} />);
    expect(screen.getByText('1–25 of 100')).toBeInTheDocument();
  });

  it('renders page number', () => {
    render(<Pagination {...baseProps} page={3} />);
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('shows correct range for middle page', () => {
    render(<Pagination {...baseProps} page={3} />);
    expect(screen.getByText('51–75 of 100')).toBeInTheDocument();
  });

  it('shows correct range for last page', () => {
    render(<Pagination {...baseProps} page={4} />);
    expect(screen.getByText('76–100 of 100')).toBeInTheDocument();
  });

  it('shows "No results" when total is 0', () => {
    render(<Pagination {...baseProps} total={0} />);
    expect(screen.getByText('No results')).toBeInTheDocument();
  });

  it('disables previous buttons on first page', () => {
    render(<Pagination {...baseProps} page={1} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons[0]).toBeDisabled();
    expect(buttons[1]).toBeDisabled();
  });

  it('disables next buttons on last page', () => {
    render(<Pagination {...baseProps} page={4} total={100} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons[2]).toBeDisabled();
    expect(buttons[3]).toBeDisabled();
  });

  it('calls onPageChange with page+1 when next is clicked', async () => {
    const onPageChange = jest.fn();
    render(<Pagination {...baseProps} page={2} onPageChange={onPageChange} />);
    const buttons = screen.getAllByRole('button');
    await userEvent.click(buttons[2]);
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it('calls onPageChange with page-1 when previous is clicked', async () => {
    const onPageChange = jest.fn();
    render(<Pagination {...baseProps} page={2} onPageChange={onPageChange} />);
    const buttons = screen.getAllByRole('button');
    await userEvent.click(buttons[1]);
    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it('calls onPageChange with 1 when first is clicked', async () => {
    const onPageChange = jest.fn();
    render(<Pagination {...baseProps} page={3} onPageChange={onPageChange} />);
    const buttons = screen.getAllByRole('button');
    await userEvent.click(buttons[0]);
    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it('calls onPageChange with totalPages when last is clicked', async () => {
    const onPageChange = jest.fn();
    render(<Pagination {...baseProps} page={1} onPageChange={onPageChange} />);
    const buttons = screen.getAllByRole('button');
    await userEvent.click(buttons[3]);
    expect(onPageChange).toHaveBeenCalledWith(4);
  });
});
