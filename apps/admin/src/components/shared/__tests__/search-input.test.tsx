import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchInput } from '../search-input';

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('SearchInput', () => {
  it('renders with placeholder', () => {
    render(<SearchInput value="" onChange={() => {}} placeholder="Search users..." />);
    expect(screen.getByPlaceholderText('Search users...')).toBeInTheDocument();
  });

  it('renders with default placeholder', () => {
    render(<SearchInput value="" onChange={() => {}} />);
    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
  });

  it('calls onChange after debounce delay', async () => {
    const onChange = jest.fn();
    render(<SearchInput value="" onChange={onChange} debounce={300} />);

    const input = screen.getByPlaceholderText('Search...');
    await userEvent.type(input, 'test', { advanceTimers: jest.advanceTimersByTime });

    act(() => {
      jest.advanceTimersByTime(400);
    });

    expect(onChange).toHaveBeenCalledWith('test');
  });

  it('clears input when clear button is clicked', async () => {
    const onChange = jest.fn();
    render(<SearchInput value="test" onChange={onChange} />);

    const clearButton = screen.getByRole('button');
    await userEvent.click(clearButton, { advanceTimers: jest.advanceTimersByTime });

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(onChange).toHaveBeenCalledWith('');
  });

  it('updates local state when value prop changes', () => {
    const { rerender } = render(<SearchInput value="initial" onChange={() => {}} />);
    expect(screen.getByDisplayValue('initial')).toBeInTheDocument();

    rerender(<SearchInput value="updated" onChange={() => {}} />);
    expect(screen.getByDisplayValue('updated')).toBeInTheDocument();
  });
});
