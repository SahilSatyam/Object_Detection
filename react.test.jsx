App Level Retn Rem

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import AppLevelRetnRem from './AppLevelRetnRem'; // Update the import path as needed
import { BrowserRouter } from 'react-router-dom';

// Mock dependencies
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: jest.fn(),
}));

jest.mock('moment-timezone', () => ({
    ...jest.requireActual('moment-timezone'),
    format: jest.fn().mockReturnValue('11 June 2024 12:00:00 EST'),
}));

jest.mock('xlsx', () => ({
    utils: {
        book_new: jest.fn(),
        json_to_sheet: jest.fn(),
        sheet_add_aoa: jest.fn(),
        sheet_add_json: jest.fn(),
        book_append_sheet: jest.fn(),
        writeFile: jest.fn(),
    },
}));

jest.mock('jspdf', () => {
    const jsPDF = jest.fn(() => ({
        setFontSize: jest.fn(),
        setFont: jest.fn(),
        text: jest.fn(),
        autoTable: jest.fn(),
        save: jest.fn(),
    }));
    return jsPDF;
});

// Mock fetch responses
global.fetch = jest.fn(() =>
    Promise.resolve({
        json: () => Promise.resolve([
            {
                "APPL_SYS_ID": "1",
                "TYPE_CD": "OBR",
                "HAS_OBR": "Yes",
                "LGL_HLD_STS": "YES",
                "APPROVED_EXTENDED_RETENTION": "No",
                "APPL_LVL_CLS_CD_COMP_IND": "Yes",
                "CRE_TS": "2024-06-11T16:00:00Z"
            }
        ]),
    })
);

describe('AppLevelRetnRem Component', () => {
    beforeEach(() => {
        fetch.mockClear();
    });

    test('renders the component with title and tiles', async () => {
        render(
            <BrowserRouter>
                <AppLevelRetnRem />
            </BrowserRouter>
        );

        expect(screen.getByTestId('app-level-retn-rem-dashboard-title-text')).toHaveTextContent('Retention Remediation Dashboard');
        await waitFor(() => {
            expect(screen.getByTestId('app-level-retn-rem-dashboard-total-apps-tile')).toBeInTheDocument();
            expect(screen.getByTestId('app-level-retn-rem-dashboard-total-obr-count-tile')).toBeInTheDocument();
            expect(screen.getByTestId('app-level-retn-rem-dashboard-total-active-legal-hold-count-tile')).toBeInTheDocument();
        });
    });

    test('filters data based on user input', async () => {
        render(
            <BrowserRouter>
                <AppLevelRetnRem />
            </BrowserRouter>
        );

        await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));

        fireEvent.change(screen.getByLabelText('Application ID'), { target: { value: '1' } });
        fireEvent.change(screen.getByLabelText('OBR v/s Non-OBR'), { target: { value: 'OBR' } });
        fireEvent.click(screen.getByTestId('app-level-retn-rem-legal-hold-filter-switch'));
        fireEvent.click(screen.getByTestId('app-level-retn-rem-approved-extended-retn-filter-switch'));
        fireEvent.click(screen.getByTestId('app-level-retn-rem-class_code_comp-filter-switch'));

        await waitFor(() => {
            expect(screen.getByText('No Data Found')).not.toBeInTheDocument();
        });
    });

    test('exports data to Excel', async () => {
        render(
            <BrowserRouter>
                <AppLevelRetnRem />
            </BrowserRouter>
        );

        await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
        fireEvent.click(screen.getByTestId('db-growth-report-excel-export-data-button'));
        // Add your expectations related to Excel export here
    });

    test('exports data to PDF', async () => {
        render(
            <BrowserRouter>
                <AppLevelRetnRem />
            </BrowserRouter>
        );

        await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
        fireEvent.click(screen.getByTestId('app-level-retn-rem-pdf-export-data-button'));
        // Add your expectations related to PDF export here
    });

    test('handles data row click', async () => {
        const mockNavigate = jest.fn();
        require('react-router-dom').useNavigate.mockReturnValue(mockNavigate);

        render(
            <BrowserRouter>
                <AppLevelRetnRem />
            </BrowserRouter>
        );

        await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
        fireEvent.click(screen.getByText('Retention Remediation Report'));
        await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
        expect(mockNavigate).toHaveBeenCalledWith("/aset-level-retn-rem-dashboard", expect.anything());
    });

    test('shows loading spinner while data is being fetched', async () => {
        render(
            <BrowserRouter>
                <AppLevelRetnRem />
            </BrowserRouter>
        );

        expect(screen.getByTestId('app-levl-retn-rem-mds-progress-spinner')).toBeInTheDocument();
        await waitFor(() => expect(screen.queryByTestId('app-levl-retn-rem-mds-progress-spinner')).not.toBeInTheDocument());
    });

    test('handles fetch error gracefully', async () => {
        fetch.mockImplementationOnce(() => Promise.reject('API is down'));

        render(
            <BrowserRouter>
                <AppLevelRetnRem />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.queryByTestId('app-levl-retn-rem-mds-progress-spinner')).not.toBeInTheDocument();
            expect(screen.getByText('Encountered error while fetching data for App Level with: API is down')).toBeInTheDocument();
        });
    });

    test('filter data with no matches', async () => {
        render(
            <BrowserRouter>
                <AppLevelRetnRem />
            </BrowserRouter>
        );

        await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));

        fireEvent.change(screen.getByLabelText('Application ID'), { target: { value: '999' } });

        await waitFor(() => {
            expect(screen.getByText('No Data Found')).toBeInTheDocument();
        });
    });

    test('button and switch initial states', async () => {
        render(
            <BrowserRouter>
                <AppLevelRetnRem />
            </BrowserRouter>
        );

        await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));

        expect(screen.getByTestId('db-growth-report-excel-export-data-button')).toBeInTheDocument();
        expect(screen.getByTestId('app-level-retn-rem-pdf-export-data-button')).toBeInTheDocument();
        expect(screen.getByTestId('app-level-retn-rem-legal-hold-filter-switch')).toBeInTheDocument();
        expect(screen.getByTestId('app-level-retn-rem-approved-extended-retn-filter-switch')).toBeInTheDocument();
        expect(screen.getByTestId('app-level-retn-rem-class_code_comp-filter-switch')).toBeInTheDocument();
    });

    test('specific row data rendering', async () => {
        render(
            <BrowserRouter>
                <AppLevelRetnRem />
            </BrowserRouter>
        );

        await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));

        expect(screen.getByText('Retention Remediation Report')).toBeInTheDocument();
        expect(screen.getByText('Yes')).toBeInTheDocument();
        expect(screen.getByText('No')).toBeInTheDocument();
    });
});




Aset Level Retn Rem

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import { BrowserRouter, useLocation } from 'react-router-dom';
import AppLevelRetnRem from './AppLevelRetnRem'; // Update the import path as needed

// Mock dependencies
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: jest.fn(),
    useLocation: jest.fn(),
}));

jest.mock('moment-timezone', () => ({
    ...jest.requireActual('moment-timezone'),
    format: jest.fn().mockReturnValue('11 June 2024 12:00:00 EST'),
}));

jest.mock('jspdf', () => {
    const jsPDF = jest.fn(() => ({
        setFontSize: jest.fn(),
        setFont: jest.fn(),
        text: jest.fn(),
        autoTable: jest.fn(),
        save: jest.fn(),
    }));
    return jsPDF;
}));

describe('AppLevelRetnRem Component', () => {
    const mockNavigate = jest.fn();
    const mockLocation = {
        state: [
            {
                APPL_SYS_ID: '123',
                APPL_SYS_NM: 'Test Application',
                ASET_ID: '456',
                ASET_NM: 'Test Data Store',
                CLS_CD_COMPARISION_IND: 'Yes',
                CRE_TS: '2024-06-11T16:00:00Z',
                // Add other necessary mock data here
            },
        ],
    };

    beforeEach(() => {
        require('react-router-dom').useNavigate.mockReturnValue(mockNavigate);
        require('react-router-dom').useLocation.mockReturnValue(mockLocation);
    });

    test('renders the component with title and tiles', () => {
        render(
            <BrowserRouter>
                <AppLevelRetnRem />
            </BrowserRouter>
        );

        expect(screen.getByText('Retention Remediation Dashboard')).toBeInTheDocument();
        expect(screen.getByTestId('aset-level-retn-rem-dashboard-total-aset')).toBeInTheDocument();
        expect(screen.getByTestId('aset-level-retn-rem-dashboard-matching-aset')).toBeInTheDocument();
        expect(screen.getByTestId('aset-level-retn-rem-dashboard-not-matching-aset')).toBeInTheDocument();
    });

    test('filters data based on user input', async () => {
        render(
            <BrowserRouter>
                <AppLevelRetnRem />
            </BrowserRouter>
        );

        fireEvent.change(screen.getByPlaceholderText('Search By Data Store ID'), { target: { value: '456' } });
        fireEvent.change(screen.getByPlaceholderText('Search By Data Store Name'), { target: { value: 'Test' } });
        fireEvent.click(screen.getByTestId('mds-switch'));

        await waitFor(() => {
            expect(screen.getByText('Test Data Store')).toBeInTheDocument();
        });
    });

    test('exports data to PDF', async () => {
        render(
            <BrowserRouter>
                <AppLevelRetnRem />
            </BrowserRouter>
        );

        fireEvent.click(screen.getByTestId('aset-level-retn-rem-pdf-export-data-button'));
        // Add your expectations related to PDF export here
    });

    test('renders application owner details', () => {
        render(
            <BrowserRouter>
                <AppLevelRetnRem />
            </BrowserRouter>
        );

        expect(screen.getByText('App Owner :')).toBeInTheDocument();
        expect(screen.getByText('Info Owner :')).toBeInTheDocument();
        expect(screen.getByText('Data Owner :')).toBeInTheDocument();
    });

    test('toggles class code comparison filter', async () => {
        render(
            <BrowserRouter>
                <AppLevelRetnRem />
            </BrowserRouter>
        );

        fireEvent.click(screen.getByTestId('mds-switch'));
        await waitFor(() => {
            expect(screen.getByText('No Data Found')).not.toBeInTheDocument();
        });

        fireEvent.click(screen.getByTestId('mds-switch'));
        await waitFor(() => {
            expect(screen.getByText('No Data Found')).toBeInTheDocument();
        });
    });

    test('navigates back to app level dashboard', () => {
        render(
            <BrowserRouter>
                <AppLevelRetnRem />
            </BrowserRouter>
        );

        fireEvent.click(screen.getByText('Retention Remediation Dashboard'));
        expect(mockNavigate).toHaveBeenCalledWith('/app-level-retn-rem-dashboard');
    });

    test('displays the correct number of datastores and class code counts', () => {
        render(
            <BrowserRouter>
                <AppLevelRetnRem />
            </BrowserRouter>
        );

        expect(screen.getByTestId('aset-level-retn-rem-dashboard-total-aset').textContent).toBe('Total Datastores1');
        expect(screen.getByTestId('aset-level-retn-rem-dashboard-matching-aset').textContent).toBe('Number of Datastores with Matching Class Code1');
        expect(screen.getByTestId('aset-level-retn-rem-dashboard-not-matching-aset').textContent).toBe('Number of Datastores with Mismatching Class Code0');
    });

    test('renders correct data in the datatable', () => {
        render(
            <BrowserRouter>
                <AppLevelRetnRem />
            </BrowserRouter>
        );

        expect(screen.getByText('Test Application')).toBeInTheDocument();
        expect(screen.getByText('Test Data Store')).toBeInTheDocument();
    });
});
