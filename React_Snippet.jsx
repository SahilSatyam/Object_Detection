import React, {useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {MdsDataTableForAccounts, MdsProgressSpinner, MdsTile, MdsIcon, MdsButton, MdsSwitch, MdsMultiselect, MdsMultiselectOption} from '@mds/react';
import * as XLSX from "xlsx";
import moment from 'moment-timezone';
import jsPDF from "jspdf";
import 'jspdf-autotable';
import "../../styles/Reports/AppLevelRetnRem.css"
import {joinRowsAndColumns} from "../../Utils";
import RetentionRemediationDashboardConfig from "../../config/RetentionRemediationDashboard.json";

let APP_LEVEL_RETENTION_REMEDIATION_API = process.env.REACT_APP_APPL_LEVEL_RETENTION_REMEDIATION_API
let ASET_LEVEL_RETENTION_REMEDIATION_API = process.env.REACT_APP_ASET_LEVEL_RETENTION_REMEDIATION_API

export default function AppLevelRetnRem() {
    const [data, setData] = useState([]);
    const [appLevelRetnRemFilteredData, setAppLevelRetnRemFilteredData] = useState([]);
    const [appLevelExportData, setAppLevelExportData] = useState(false);
    const [spinnerOn, setSpinnerOn] = React.useState(false);
    const [applicationsCount, setApplicationsCount] = useState(0);
    const [obrClassCodeCount, setObrClassCodeCount] = useState(0);
    const [activeLegalHoldCount, setActiveLegalHoldCount] = useState(0);
    const [appIDQuery, setAppIDQuery] = useState("");
    const [typeQuery, setTypeQuery] = useState("");
    const [legalHoldFilter, setLegalHoldFilter] = useState("");
    const [approvedExtendedRetentionFilter, setApprovedExtendedRetentionFilter] = useState("");
    const [classCodeComparisonFilter, setClassCodeComparisonFilter] = useState("");
    // const [currentPage, setCurrentPage] = useState(1);
    

    const navigate = useNavigate();

    useEffect(() => {
        fetch(`${APP_LEVEL_RETENTION_REMEDIATION_API}`)
            .then(setSpinnerOn(true))
            .then((response) => response.json())
            .then((data) => {
                const combinedData = joinRowsAndColumns(data);
                setData(combinedData);
                setSpinnerOn(false);
                setAppLevelExportData(true);
            })
            .catch(err => {
                console.log("Encountered error while fetching data for App Level with:", err)
                setSpinnerOn(false)
            })
    }, []);

    // const pageSize = 12;
    // const totalItems = appLevelRetnRemFilteredData.length;
    // const pageCount = Math.ceil(totalItems / pageSize);

    // const handlePreviousPage = () => {
    //     setCurrentPage((prevPage) => Math.max(prevPage - 1, 1));
    // };
    // const handleNextPage = () => {
    //     setCurrentPage((prevPage) => Math.min(prevPage + 1, pageCount));
    // };
    // const renderPageNumbers = () => {
    //     const visiblePage = 5;
    //     const sideDots = 2;

    //     let startPage = currentPage - Math.floor(visiblePage / 2);
    //     startPage = Math.max(startPage, 1)
    //     const endPage = Math.min(startPage + visiblePage - 1, pageCount);

    //     let pageNumbers = [];
    //     if (currentPage > sideDots + 1) {
    //     pageNumbers.push(1);
    //     if (currentPage > sideDots + 2) {
    //         pageNumbers.push('dots');
    //     }
    //     }
    //     for (let i = startPage; i <= endPage; i++) {
    //     pageNumbers.push(i);
    //     }
    //     if (currentPage < pageCount - sideDots) {
    //     if (currentPage < pageCount - sideDots - 1) {
    //         pageNumbers.push('dots');
    //     }
    //     pageNumbers.push(pageCount);
    //     }
    //     return pageNumbers.map((pageNumber, index) => {
    //     if (pageNumber === 'dots') {
    //         return <span key={`dots${index}`} className="dots">...</span>;
    //     }
    //     return (
    //     <div
    //         key={pageNumber}
    //         className={`slider-item ${currentPage === pageNumber ? "active" : ""}`}
    //         onClick={() => setCurrentPage(pageNumber)}
    //         >
    //         <div data-testid={`page-${pageNumber}`}>{pageNumber}</div>
    //         </div>
    //     );
    //     });
    // };

    useEffect(() => {
        const applicationsCount = data.length;
        setApplicationsCount(applicationsCount);
        const obrClassCodeCount = data.filter(item => item["HAS_OBR"] === 'Yes').length;
        setObrClassCodeCount(obrClassCodeCount);
        const activeLegalHoldCount = data.filter(item => item["LGL_HLD_STS"] === 'YES').length; // From API We get "YES" but in ui We Replace as "Yes"
        setActiveLegalHoldCount(activeLegalHoldCount);

    }, [data]);

    useEffect(() => {
        if (appIDQuery.length === 0 &&
            typeQuery.length === 0 &&
            legalHoldFilter === "" &&
            approvedExtendedRetentionFilter === "" &&
            classCodeComparisonFilter === ""){
            setAppLevelRetnRemFilteredData(data);
        } else {
            const filtered = data.filter(item => {
                const appID = String(item["APPL_SYS_ID"]);
                const type = String(item["TYPE_CD"]);

                const appIDMatch = appIDQuery.length === 0 || appIDQuery.some(selectedType => selectedType === appID);
                const typeMatch = typeQuery.length === 0 || typeQuery.some(selectedType => selectedType === type);
                const legalHoldMatch = String(item["LGL_HLD_STS"]).toLowerCase().startsWith(legalHoldFilter.toLowerCase());
                const approvedExtendedRetentionMatch = String(item["APPROVED_EXTENDED_RETENTION"]).toLowerCase().startsWith(approvedExtendedRetentionFilter.toLowerCase());
                const classCodeComparisonMatch = String(item["APPL_LVL_CLS_CD_COMP_IND"]).toLowerCase().startsWith(classCodeComparisonFilter.toLowerCase());

                return(appIDMatch && typeMatch && legalHoldMatch && approvedExtendedRetentionMatch && classCodeComparisonMatch);
        });
            setAppLevelRetnRemFilteredData(filtered);
        }
    }, [data, appIDQuery, typeQuery, legalHoldFilter, approvedExtendedRetentionFilter, classCodeComparisonFilter]);

    const mdsTileContent = [
        {
            testid: "app-level-retn-rem-dashboard-total-apps-tile",
            title: 'Total Applications',
            calculations: applicationsCount
        },
        {
            testid: "app-level-retn-rem-dashboard-total-obr-count-tile",
            title: 'Applications having OBR Class Codes',
            calculations: obrClassCodeCount
        },
        {
            testid: "app-level-retn-rem-dashboard-total-active-legal-hold-count-tile",
            title: 'Applications on Legal Hold',
            calculations: activeLegalHoldCount
        },
    ];

    const mdsMultiSelectComponentForAppID = []
    const mdsMultiSelectComponentForType = []

    data.forEach((row) => {
        if (!mdsMultiSelectComponentForAppID.some(item => item.value === row.APPL_SYS_ID)) {
            mdsMultiSelectComponentForAppID.push({
            label: row.APPL_SYS_ID,
            value: row.APPL_SYS_ID
        });}
        if (!mdsMultiSelectComponentForType.some(item => item.value === row.TYPE_CD)) {
            mdsMultiSelectComponentForType.push({
            label: row.TYPE_CD,
            value: row.TYPE_CD
        });}
    });

    const exportToExcel = (csvData) => {
        const convertToEST = (utcTime) => {
          return moment.utc(utcTime).tz("America/New_York").format('DD MMMM YYYY HH:mm:ss');
        }
        const dataWithEST = csvData.map(item => {
          return {
            ...item,
            CRE_TS: item.CRE_TS ? convertToEST(item.CRE_TS) : item.CRE_TS,
          }});
    
        const columnNames = [['Product Group', 'Product', 'Application ID', 'Application Name', 'Application State', 'Application Owner SID', 'Application Owner Name',
        'Info Owner SID', 'Info Owner Name', 'Data Owner SID', 'Data Owner Name', 'Overall Hosting Type', 'Legal Hold Status', 'Retention Status', 'Destruction Status', 'OBR v/s Non-OBR', 'Has OBR', 'Approved Extended Retention',
        'Actual Operate Date', 'Overall Earliest Destruction Eligible Date', 'Purge Eligible', 'Time Remaining', 'DataFit Approver Check', 'DB Growth Data Purge Flag', 'Class Code Comparison', 'Report Generated On']]
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet([]);
        XLSX.utils.sheet_add_aoa(ws, columnNames);
    
        XLSX.utils.sheet_add_json(ws, dataWithEST, { origin: 'A2', skipHeader: true });
        XLSX.utils.book_append_sheet(wb, ws, 'Data');
        XLSX.writeFile(wb, 'Retention Remediation App Level.xlsx');
      };

    const reportGeneratedTime = appLevelExportData ? moment.utc(data[0].CRE_TS).tz("America_New_York").format("DD MMMM YYYY HH:mm:ss") + ' EST' : '-';
    const exportToPDF = (pdfData) => {
        const doc = new jsPDF("landscape", "pt", "A2");
        doc.setFontSize(20);
        doc.setFont("Times New Roman");
        const title = "Retention Remediation Report";
        doc.text(title, 850, 30, { align: 'center' });
        doc.setFontSize(14);
        const refreshedDataText = "Report Generated On: " + reportGeneratedTime;
        doc.text(refreshedDataText, 40, 30, { align: 'left' });

        const headers = [['Product Group', 'Product', 'Application ID', 'Application Name', 'Application State', 'Application Owner', 'Info Owner', 'Data Owner', 
        'Overall Hosting Type', 'Legal Hold Status', 'Retention Status', 'Destruction Status', 'OBR v/s Non-OBR', 'Has OBR', 'Approved Extended Retention',
        'Actual Operate Date', 'Overall Earliest Destruction Eligible Date', 'Purge Eligible', 'Time Remaining', 'DataFit Approver Check', 'DB Growth Data Purge Flag','Class Code Comparison']];
        const PDFData = pdfData.map(
        row=> [row.LOB_FCTN_NM, row.PROD_NM, row.APPL_SYS_ID, row.APPL_SYS_NM, row.APPL_SYS_STS_NM, row.APPL_OWNR_SID,
            row.INFO_OWNR_SID, row.DATA_OWNR_SID, row.OVRL_HOST_TYPE_NM, row.LGL_HLD_STS, row.DATA_RQR_DOC_STS_CD,
            row.DD_STS_CD, row.TYPE_CD, row.HAS_OBR, row.APPROVED_EXTENDED_RETENTION, row.ACTL_OPER_DT,
            row.OVRL_ERLST_DESTR_ELIG_DT, row.PURGE_ELIGIBLE, row.TIME_REMAINING, row.DATAFIT_APPROVER_CHECK,
            row.APPL_LVL_FLAG, row.APPL_LVL_CLS_CD_COMP_IND]);

        let content = {
        startY: 50,
        styles: {overflow: 'linebreak'},
        columnStyles: { 10: { cellWidth: 150 } }, // Specify the column Number (start from 0) where Max Space is used.
        head: headers,
        body: PDFData
        };

        doc.setFontSize(12);
        doc.autoTable(content);
        doc.save("Retention Remediation App Level.pdf");
    };

  function handleAppLevelClick(appLevelRetnRemFilteredData, rowIndex) {
    rowIndex = rowIndex - 1;
      fetch(
        `${ASET_LEVEL_RETENTION_REMEDIATION_API}` +
        "?appl_sys_id=" +
        appLevelRetnRemFilteredData[rowIndex]["APPL_SYS_ID"]
      )
        .then(setSpinnerOn(true))
        .then((response) => response.json())
        .then((data) => {
          const combinedData = joinRowsAndColumns(data);
          setSpinnerOn(false);
          navigate("/aset-level-retn-rem-dashboard", {state: combinedData});
        })
        .catch(err => {
          console.log("Error while fetching Aset Level Data on row click: ", err)
          setSpinnerOn(false)
        })
  }

    return (
        <div className="app-level-retn-rem-dashboard">
            <div className="app-level-retn-rem-dashboard-title">
                <p data-testid="app-level-retn-rem-dashboard-title-text" className="app-level-retn-rem-dashboard-title-text">Retention Remediation Dashboard</p>
            </div>
            <div data-testid="app-level-retn-rem-dashboard-tiles" className="app-level-retn-rem-dashboard-tiles">
                {mdsTileContent.map((tile, index) => (
                    <MdsTile
                        key={index}
                        data-testid={tile.testid}
                        tileTitle={tile.title}
                        hideTitle={false}
                        interactive={false}
                        variant="classic"
                        horizontalPadding="regular"
                        backgroundColor="#000000">
                        <div slot="tile-content">
                            {tile.calculations}
                        </div>
                    </MdsTile>
                ))}
            </div>
                <div className="app-level-retn-rem-dashboard-filters">
                    <div className="multiselect">
                        <div className="multiselect-values">
                            <MdsMultiselect
                                id='demo-multiselect'
                                name='demo-multiselect'
                                variant="line"
                                label="Application ID"
                                state='active'
                                placeholder='Select Application IDs'
                                onChange={(e) => {
                                    setAppIDQuery(e.target.value);
                                }}
                                >
                                {mdsMultiSelectComponentForAppID.map((multiSelect, index) => (
                                    <MdsMultiselectOption
                                            key={index}
                                            id='multi-select-option-1'
                                            state= "hovered"
                                            label={multiSelect.label}
                                            value={multiSelect.value}
                                    ></MdsMultiselectOption>
                                ))}
                            </MdsMultiselect>
                        </div>
                    </div>
                    <div className="multiselect">
                        <div className="multiselect-values">
                            <MdsMultiselect
                                id='demo-multiselect'
                                name='demo-multiselect'
                                variant="line"
                                label="OBR v/s Non-OBR"
                                state='active'
                                placeholder='Select Types'
                                onChange={(e) => {setTypeQuery(e.target.value);}}
                                >
                                {mdsMultiSelectComponentForType.map((multiSelect, index) => (
                                    <MdsMultiselectOption
                                            key={index}
                                            id='multi-select-option-1'
                                            label={multiSelect.label}
                                            value={multiSelect.value}
                                    ></MdsMultiselectOption>
                                ))}
                            </MdsMultiselect>
                        </div>
                    </div>
                    <div className="app-level-retn-rem-legal-hold-filter">
                        <MdsSwitch
                            data-testid="app-level-retn-rem-legal-hold-filter-switch"
                            label="Legal Hold Filter"
                            stateLabelOn="On"
                            stateLabelOff="Off"
                            onChange={() => {
                                legalHoldFilter === "Yes" ? setLegalHoldFilter("") : setLegalHoldFilter("Yes");
                            }}
                        ></MdsSwitch>
                    </div>
                    <div className="app-level-retn-rem-approved-extended-retn-filter">
                        <MdsSwitch
                            data-testid="app-level-retn-rem-approved-extended-retn-filter-switch"
                            label="Approved Extended Retention Filter"
                            stateLabelOn="On"
                            stateLabelOff="Off"
                            onChange={() => {
                                approvedExtendedRetentionFilter === "Yes" ? setApprovedExtendedRetentionFilter("") : setApprovedExtendedRetentionFilter("Yes");
                            }}
                        ></MdsSwitch>
                    </div>
                    <div className="app-level-retn-rem-class_code_comp-filter">
                        <MdsSwitch
                            data-testid="app-level-retn-rem-class_code_comp-filter-switch"
                            label="Class Code Comparison Filter"
                            stateLabelOn="On"
                            stateLabelOff="Off"
                            onChange={() => {
                                classCodeComparisonFilter === "Yes" ? setClassCodeComparisonFilter("") : setClassCodeComparisonFilter("Yes");
                            }}
                        ></MdsSwitch>
                    </div>
                    <div className="app-level-retn-rem-export-options">
                        <MdsButton
                            data-testid="db-growth-report-excel-export-data-button"
                            text="Excel"
                            variant="secondary"
                            widthType="content"
                            type="button"
                            onClick={() => exportToExcel(appLevelRetnRemFilteredData)}
                            />
                        <MdsButton
                            data-testid="app-level-retn-rem-pdf-export-data-button"
                            text="PDF"
                            variant="secondary"
                            widthType="content"
                            type="button"
                            onClick={() => exportToPDF(appLevelRetnRemFilteredData)}
                            />
                    </div>
                </div>
            <div className="top-line-for-app-level-retn-rem-dashboard-table"/>
            <div className="app-level-retn-rem-datatable">
                <center>
                    <MdsDataTableForAccounts
                        caption="Application Level Retention Remediation Dashboard"
                        hasVisibleCaption={false}
                        hasHoverColor={true}
                        mode="compact"
                        layout="column"
                        columnConfigs={RetentionRemediationDashboardConfig.AppLevelRetentionRemediationReportColumns}
                        rowData={ appLevelRetnRemFilteredData.map(row => (
                            // appLevelRetnRemFilteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize).map(row => (
                                    [
                                        {value: String(row["LOB_FCTN_NM"])},
                                        {value: String(row["PROD_NM"])},
                                        {value: String(row["APPL_SYS_ID"])},
                                        {value: String(row["APPL_SYS_NM"])},
                                        {value: String(row["APPL_SYS_STS_NM"])},
                                        {value: String(row["APPL_OWNR_SID"])},
                                        {value: String(row["INFO_OWNR_SID"])},
                                        {value: String(row["DATA_OWNR_SID"])},
                                        {value: String(row["OVRL_HOST_TYPE_NM"])},
                                        {value: row["LGL_HLD_STS"] ? String(row["LGL_HLD_STS"]).replace("NO", "No").replace("YES", "Yes") : "-"},
                                        {value: String(row["DATA_RQR_DOC_STS_CD"])},
                                        {value: String(row["DD_STS_CD"])},
                                        {value: row["TYPE_CD"] ? String(row["TYPE_CD"]) : "-"},
                                        {value: String(row["HAS_OBR"])},
                                        {value: row["APPROVED_EXTENDED_RETENTION"] ? String(row["APPROVED_EXTENDED_RETENTION"]) : "-"},
                                        {value: row["ACTL_OPER_DT"] ? String(row["ACTL_OPER_DT"]) : "-" },
                                        {value: row["OVRL_ERLST_DESTR_ELIG_DT"] ? String(row["OVRL_ERLST_DESTR_ELIG_DT"]) : "-"},
                                        {value: String(row["PURGE_ELIGIBLE"])},
                                        {value: row["TIME_REMAINING"] ? String(row["TIME_REMAINING"]) : "-"},
                                        {value: String(row["DATAFIT_APPROVER_CHECK"])},
                                        {value: row["APPL_LVL_FLAG"] ? String(row["APPL_LVL_FLAG"]) : "-"},
                                        {value: String(row["APPL_LVL_CLS_CD_COMP_IND"]),
                                            "alertMessage": {
                                                "title": "",
                                                "variant": String(row["APPL_LVL_CLS_CD_COMP_IND"]) === "Yes" ? "success" : "error",
                                                "accessibleTextIcon": String(row["APPL_LVL_CLS_CD_COMP_IND"]) === "Yes" ? "success icon" : "error icon"
                                            }
                                        },
                                        {buttonItems: [
                                            {
                                                tooltipText: "Data Store Info",
                                                icon: "ico_chevron_circle_right",
                                            }],
                                        },
                                    ]
                                )
                            )
                        }
                        nullStateMessage="No Data Found"
                        onClick={(e) => handleAppLevelClick(appLevelRetnRemFilteredData, e.detail.rowIndex)}
                        rowStyle="solid"
                    />
                </center>
            </div>
            {/* <div className="pagination-wrapper">
                <MdsIcon
                data-testid="previous-icon"
                size="20"
                color="default"
                type="ico_double_arrow_left"
                removeHorizontalMargin="false"
                onClick={handlePreviousPage}>
                </MdsIcon>
                <div className="slider">
                {renderPageNumbers()}
                </div>
                <MdsIcon
                data-testid="next-icon"
                size="20"
                color="default"
                type="ico_double_arrow_right"
                removeHorizontalMargin="false"
                onClick={handleNextPage}>
                </MdsIcon>
            </div> */}
            {spinnerOn && <MdsProgressSpinner
                data-testid="app-levl-retn-rem-mds-progress-spinner"
                loadingLabel="Loading Data..."
                microcopy="microcopy"
                inverse={false}
                open={spinnerOn}
            />}
        </div>
    );
}














// ------------------------------------------------------------------------------------------------------------------- // 

import React, {useEffect, useState} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {MdsDataTableForAccounts, MdsTile, MdsIcon,MdsButton, MdsSwitch, MdsTabBar, MdsTileAccordion, MdsDescriptionList} from '@mds/react';
import moment from 'moment-timezone';
import jsPDF from "jspdf";
import 'jspdf-autotable';
import "../../styles/Reports/AsetLevelRetnRem.css";
import RetentionRemediationReportConfig from "../../config/RetentionRemediationDashboard.json";

export default function AppLevelRetnRem() {
    const navigate = useNavigate();
    const location = useLocation();
    const asetLevelRetnRemData = location.state;
    const [asetLevelfilteredData, setAsetLevelFilteredData] = useState([]);
    const [datastoreCount, setDataStoreCount] = useState(0);
    const [matchClassCodeCount, setMatchClassCodeCount] = useState(0);
    const [mismatchClassCodeCount, setMismatchClassCodeCount] = useState(0);
    const [dataStoreIDQuery, setDataStoreIDQuery] = useState("");
    const [dataStoreNameQuery, setDataStoreNameQuery] = useState("");
    const [classCodeIndicatorQuery, setClassCodeIndicatorQuery] = useState("");

    useEffect(() => {
        if (dataStoreIDQuery.trim() === "" &&
            dataStoreNameQuery.trim() === "" &&
            classCodeIndicatorQuery.trim() === "") {
            setAsetLevelFilteredData(asetLevelRetnRemData);
        } else {
            const asetLevelfilteredData = asetLevelRetnRemData.filter(
                (item) =>
                    String(item["ASET_ID"]).toLowerCase()
                        .startsWith(dataStoreIDQuery.toLowerCase()) &&
                    String(item["ASET_NM"]).toLowerCase()
                        .includes(dataStoreNameQuery.toLowerCase()) &&
                    String(item["CLS_CD_COMPARISION_IND"]).toLowerCase()
                        .startsWith(classCodeIndicatorQuery.toLowerCase())
            );
            setAsetLevelFilteredData(asetLevelfilteredData);
        }
    }, [asetLevelRetnRemData, dataStoreIDQuery, dataStoreNameQuery, classCodeIndicatorQuery]);

    useEffect(() => {
        const datastoreCount = asetLevelRetnRemData.length;
        const matchClassCodeCount = asetLevelRetnRemData.filter((item) => item["CLS_CD_COMPARISION_IND"] === "Yes").length;
        const mismatchClassCodeCount = asetLevelRetnRemData.filter((item) => item["CLS_CD_COMPARISION_IND"] === "No").length;
        setDataStoreCount(datastoreCount);
        setMatchClassCodeCount(matchClassCodeCount);
        setMismatchClassCodeCount(mismatchClassCodeCount);
    }, [asetLevelRetnRemData]);
    
    const mdsTileContent = [
        { testid: "aset-level-retn-rem-dashboard-total-aset", title: "Total Datastores", calculations: datastoreCount },
        { testid: "aset-level-retn-rem-dashboard-matching-aset", title: "Number of Datastores with Matching Class Code", calculations: matchClassCodeCount },
        { testid: "aset-level-retn-rem-dashboard-not-matching-aset", title: "Number of Datastores with Mismatching Class Code", calculations: mismatchClassCodeCount },
    ];

    const reportGeneratedTime = moment.utc(asetLevelRetnRemData[0].CRE_TS).tz("America_New_York").format("DD MMMM YYYY HH:mm:ss") + ' EST';
    const exportToPDF = (pdfData) => {
        const doc = new jsPDF("landscape", "pt", "A2");
        doc.setFontSize(20);
        doc.setFont("Times New Roman");
        const title = "Retention Remediation Report";
        doc.text(title, 850, 30, { align: 'center' });
        doc.setFontSize(14);
        const refreshedDataText = "Report Generated On: " + reportGeneratedTime;
        doc.text(refreshedDataText, 40, 30, { align: 'left' });

        const headers = [['Application ID', 'Application Name', 'Data Store ID', 'Data Store Name', 'Purpose Class Code','Registration Status', 'Retention Country Name', 'Retention Event Date', 'Record Class Code (DAI)', 
        'Retention Class Code (Datafit)',  'Data Store Has Name', 'Data Store Has Class Code', 'Class Code Comparison']];
        const PDFData = pdfData.map(
        row=> [row.APPL_SYS_ID, row.APPL_SYS_NM, row.ASET_ID, row.ASET_NM, row.PRPS_CLS_CD, row.RGST_STS_CD,
            row.RETN_CNTRY_NM, row.EFF_TS, row.RCRD_CLS_CD, row.RETN_CLS_MV, row.HAS_DATA_STOR_NM, row.DATA_STOR_HAS_CLS_CD, row.CLS_CD_COMPARISION_IND]);

        let content = {
        startY: 50,
        styles: {overflow: 'linebreak'},
        head: headers,
        body: PDFData
        };

        doc.setFontSize(12);
        doc.autoTable(content);
        doc.save("Retention Remediation Aset Level.pdf");
    };

    return (
        <div className="aset-level-retn-rem-dashboard">
            <div className="aset-level-retn-rem-dashboard-title">
                <div className="gotoAppLevel">
                    <MdsIcon
                        size="24"
                        color="inverse"
                        type="ico_chevron_circle_left"
                        remove-horizontal-margin="false"
                        onClick={() => navigate("/app-level-retn-rem-dashboard")}>
                    </MdsIcon>
                </div>
                <p className="aset-level-retn-rem-dashboard-title-text">Retention Remediation Dashboard</p>
            </div>
            <div className="top-line-aset-level"></div>
            <div className="aset-level-retn-rem-content">
                <MdsTabBar
                    id="mds-tab-bar--cmb"
                    data-testid="aset-level-retn-rem-tab-bar"
                    tabs={[
                        { text: 'Data Store Information' },
                        { text: 'Retention and Destruction Information and Create JIRA Story' }
                    ]}
                    >
                    <p slot="panel-0">
                        <div className="aset-level-retn-rem-data-store-info">
                            <div className="aset-level-retn-rem-dashboard-tiles">
                                {mdsTileContent.map((tile, index) => (
                                    <MdsTile
                                        key={index}
                                        data-testid={tile.testid}
                                        tileTitle={tile.title}
                                        hideTitle={false}
                                        interactive={false}
                                        variant="classic"
                                        horizontalPadding="regular"
                                        backgroundColor="#000000"
                                    >
                                        <div slot="tile-content">{tile.calculations}</div>
                                    </MdsTile>
                                ))}
                            </div>
                            <div className="aset-level-retn-rem-dashboard-filters">
                                <div className="searchbox">
                                    <div className="search-input-container">
                                        <input
                                            name="databaseIDSearch"
                                            placeholder="Search By Data Store ID"
                                            value={dataStoreIDQuery}
                                            onChange={(e) => {
                                                setDataStoreIDQuery(e.target.value.toLowerCase());
                                            }}
                                        />
                                        {dataStoreIDQuery && (
                                            <button className="clear-button" onClick={() => setDataStoreIDQuery("")}>✖</button>
                                        )}
                                    </div>
                                </div>
                                <div className="searchbox">
                                    <div className="search-input-container">
                                        <input
                                            name="databaseNameSearch"
                                            placeholder="Search By Data Store Name"
                                            value={dataStoreNameQuery}
                                            onChange={(e) => {
                                                setDataStoreNameQuery(e.target.value.toLowerCase());
                                            }}
                                        />
                                        {dataStoreNameQuery && (
                                            <button className="clear-button" onClick={() => setDataStoreNameQuery("")}>✖</button>
                                        )}
                                    </div>
                                </div>
                                <div className="class-code-comparison-filter">
                                    <MdsSwitch
                                        data-testid="mds-switch"
                                        label="Class Code Comparison Filter"
                                        stateLabelOn="On"
                                        stateLabelOff="Off"
                                        onChange={() => {
                                            classCodeIndicatorQuery === "No"? setClassCodeIndicatorQuery(""): setClassCodeIndicatorQuery("No");
                                        }}
                                    ></MdsSwitch>
                                </div>
                                <div className="aset-level-retn-rem-export-options">
                                    <MdsButton
                                        data-testid="aset-level-retn-rem-pdf-export-data-button"
                                        text="PDF"
                                        variant="secondary"
                                        widthType="content"
                                        type="button"
                                        onClick={() => exportToPDF(asetLevelfilteredData)}
                                        />
                                </div>
                            </div>
                            <div className="aset-level-retn-rem-dashboard-app-info">
                                <div className="aset-level-retn-rem-dashboard-app-name-heading" data-testid="aset-level-retn-rem-dashboard-app-name-heading">
                                    <h1>{asetLevelRetnRemData[0]['APPL_SYS_ID']} : {asetLevelRetnRemData[0]['APPL_SYS_NM']}</h1>
                                </div>
                                <div className="aset-level-retn-rem-dashboard-app-owner-details" data-testid="aset-level-retn-rem-dashboard-app-owner-details">
                                    <div className="aset-level-retn-rem-dashboard-app-owner">
                                        <p>App Owner : {asetLevelRetnRemData[0]['APPL_OWNR_NM']},  {asetLevelRetnRemData[0]['APPL_OWNR_SID']}</p>
                                    </div>  
                                    <div className="aset-level-retn-rem-dashboard-info-owner">
                                        <p>Info Owner : {asetLevelRetnRemData[0]['INFO_OWNR_NM']},  {asetLevelRetnRemData[0]['INFO_OWNR_SID']}</p>
                                    </div>
                                    <div className="aset-level-retn-rem-dashboard-data-owner">
                                        <p>Data Owner : {asetLevelRetnRemData[0]['DATA_OWNR_NM']},  {asetLevelRetnRemData[0]['DATA_OWNR_SID']}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="top-line-aset-level"></div>
                            <div className="aset-level-retn-rem-dashboard-datatable">
                                <center>
                                    <MdsDataTableForAccounts
                                        caption="Aset Level Retention Remediation Dashboard"
                                        hasVisibleCaption={false}
                                        hasHoverColor={true}
                                        mode="compact"
                                        layout="column"
                                        columnConfigs={RetentionRemediationReportConfig.AsetLevelRetentionRemediationReportColumns}
                                        rowData={
                                            asetLevelfilteredData.map((row) => [
                                                    { value: String(row["APPL_SYS_ID"])},
                                                    { value: String(row["APPL_SYS_NM"])},
                                                    { value: row["ASET_ID"] ? String(row["ASET_ID"]) : "-" },
                                                    { value: row["ASET_NM"] ? String(row["ASET_NM"]) : "-" },
                                                    { value: row["PRPS_CLS_CD"] ? String(row["PRPS_CLS_CD"]) : "-" },
                                                    { value: row["RGST_STS_CD"] ? String(row["RGST_STS_CD"]) : "-" },
                                                    { value: row["RETN_CNTRY_NM"] ? String(row["RETN_CNTRY_NM"]) : "-" },
                                                    { value: row["EFF_TS"] ? String(row["EFF_TS"]) : "-" },
                                                    { value: row["RCRD_CLS_CD"] ? String(row["RCRD_CLS_CD"]) : "-" },
                                                    { value: row["RETN_CLS_MV"] ? String(row["RETN_CLS_MV"]) : "-" },
                                                    { value: row["HAS_DATA_STOR_NM"] ? String(row["HAS_DATA_STOR_NM"]) : "-" },
                                                    { value: row["DATA_STOR_HAS_CLS_CD"] ? String(row["DATA_STOR_HAS_CLS_CD"]) : "-" },
                                                    {value: row["CLS_CD_COMPARISION_IND"],
                                                        alertMessage: {
                                                            variant:
                                                            String(row["CLS_CD_COMPARISION_IND"]) === "Yes" ? "success" : String(row["CLS_CD_COMPARISION_IND"]) === "No" ? "error" : "soft",
                                                            title: "",
                                                            accessibleTextIcon: String(row["CLS_CD_COMPARISION_IND"]) === "Yes" ? "success icon" : "error icon"}
                                                    }
                                                ]
                                            )
                                        }
                                        nullStateMessage="No Data Found"
                                        rowStyle="solid"
                                    />
                                </center>
                            </div>
                        </div>
                    </p>
                    <p slot="panel-1">
                        <div className="aset-level-retn-rem-drd-info-and-jira">
                            <div className="aset-level-retn-rem-drd-info">
                                <div className="aset-level-retn-rem-drd-info-tiles">
                                    <MdsTileAccordion
                                        data-testid="mds-tile-accordion-for-eligibility-dates"
                                        defaultOpen="true"
                                        accordionItems={[
                                            {
                                            name: 'first',
                                            label: 'Destruction Eligibility Dates'
                                            },
                                        ]}
                                        >
                                        <span slot="first">
                                            <MdsDescriptionList
                                                description-alignment="left"
                                                item-layout="horizontal"
                                                items={[
                                                    {"term": "Calculated Earliest Destruction Eligible Date", "description": asetLevelRetnRemData[0]["CALC_ERLST_DESTR_ELIG_DT"]},
                                                    {"term": "Overall Earliest Destruction Eligible Date", "description": asetLevelRetnRemData[0]["OVRL_ERLST_DESTR_ELIG_DT"]},
                                                    {"term": "Time Remaining", "description": asetLevelRetnRemData[0]["TIME_REMAINING"]},
                                                    {"term": "Has Destruction Eligible Data", "description": asetLevelRetnRemData[0]["HAS_DESTR_ELIG_DATA"]},
                                                ]}>
                                            </MdsDescriptionList>
                                        </span>
                                    </MdsTileAccordion>
                                    <MdsTileAccordion
                                        data-testid="mds-tile-accordion-for-extended-retention"
                                        defaultOpen="true"
                                        accordionItems={[
                                            {
                                            name: 'first',
                                            label: 'Extended Retention'
                                            },
                                        ]}
                                        >
                                        <span slot="first">
                                            <MdsDescriptionList
                                                description-alignment="left"
                                                item-layout="horizontal"
                                                items={[
                                                    {"term": "Approved Extended Retention", "description": asetLevelRetnRemData[0]["APPROVED_EXTENDED_RETENTION"]},
                                                    {"term": "Extended Retention Date", "description": asetLevelRetnRemData[0]["EXTENDED_RETENTION_DT"] ? String( asetLevelRetnRemData[0]["EXTENDED_RETENTION_DT"]).replace("00:00:00", "") : asetLevelRetnRemData[0]["EXTENDED_RETENTION_DT"]},
                                                ]}>
                                            </MdsDescriptionList>
                                        </span>
                                    </MdsTileAccordion>
                                    <MdsTileAccordion
                                        data-testid="mds-tile-accordion-for-destruction-capability"
                                        defaultOpen="true"
                                        accordionItems={[
                                            {
                                            name: 'first',
                                            label: 'Destruction Capability'
                                            },
                                        ]}
                                        >
                                        <span slot="first">
                                            <MdsDescriptionList
                                                description-alignment="left"
                                                item-layout="horizontal"
                                                items={[
                                                    {"term": "Required Destruction Process Frequency", "description":  asetLevelRetnRemData[0]["REQ_DESTR_PROC_FREQ"]},
                                                    {"term": "Destruction Enabled", "description": asetLevelRetnRemData[0]["DESTR_ENBL"]}
                                                ]}>
                                            </MdsDescriptionList>
                                        </span>
                                    </MdsTileAccordion>
                                </div>
                            </div>
                            <div className="aset-level-retn-rem-jira">
                                <p style={{textAlign:'center', margin: '10px', borderRadius:'5px'}}>
                                    <MdsButton 
                                        text="Create Jira and Attach Evidence"
                                        variant="primary"
                                        width-type="content"
                                        type="button"
                                        icon-position="leading"
                                        small="false">
                                    </MdsButton>
                                </p>
                            </div>
                        </div>
                    </p>
                </MdsTabBar>
            </div>
        </div>
    )
}




/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// AppLevelRetnRem.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import { BrowserRouter as Router } from 'react-router-dom';
import AppLevelRetnRem from './AppLevelRetnRem';
import * as Utils from '../../Utils';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';

jest.mock('../../Utils', () => ({
  joinRowsAndColumns: jest.fn(),
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
  return jest.fn().mockImplementation(() => ({
    setFontSize: jest.fn(),
    setFont: jest.fn(),
    text: jest.fn(),
    autoTable: jest.fn(),
    save: jest.fn(),
  }));
});

global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve([]),
  })
);

describe('AppLevelRetnRem Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders without crashing', () => {
    render(
      <Router>
        <AppLevelRetnRem />
      </Router>
    );
    expect(screen.getByTestId('app-level-retn-rem-dashboard-title-text')).toBeInTheDocument();
  });

  test('displays loading spinner during API call', async () => {
    render(
      <Router>
        <AppLevelRetnRem />
      </Router>
    );
    expect(screen.getByTestId('app-levl-retn-rem-mds-progress-spinner')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByTestId('app-levl-retn-rem-mds-progress-spinner')).not.toBeInTheDocument());
  });

  test('handles data fetch and state updates', async () => {
    const mockData = [
      { APPL_SYS_ID: '1', TYPE_CD: 'A', LGL_HLD_STS: 'YES', APPROVED_EXTENDED_RETENTION: 'Yes', APPL_LVL_CLS_CD_COMP_IND: 'Yes' },
      { APPL_SYS_ID: '2', TYPE_CD: 'B', LGL_HLD_STS: 'NO', APPROVED_EXTENDED_RETENTION: 'No', APPL_LVL_CLS_CD_COMP_IND: 'No' }
    ];
    Utils.joinRowsAndColumns.mockReturnValue(mockData);

    render(
      <Router>
        <AppLevelRetnRem />
      </Router>
    );

    await waitFor(() => expect(Utils.joinRowsAndColumns).toHaveBeenCalled());
    expect(screen.getByTestId('app-level-retn-rem-dashboard-total-apps-tile')).toHaveTextContent('2');
    expect(screen.getByTestId('app-level-retn-rem-dashboard-total-obr-count-tile')).toHaveTextContent('0');
    expect(screen.getByTestId('app-level-retn-rem-dashboard-total-active-legal-hold-count-tile')).toHaveTextContent('1');
  });

  test('applies filters correctly', async () => {
    const mockData = [
      { APPL_SYS_ID: '1', TYPE_CD: 'A', LGL_HLD_STS: 'YES', APPROVED_EXTENDED_RETENTION: 'Yes', APPL_LVL_CLS_CD_COMP_IND: 'Yes' },
      { APPL_SYS_ID: '2', TYPE_CD: 'B', LGL_HLD_STS: 'NO', APPROVED_EXTENDED_RETENTION: 'No', APPL_LVL_CLS_CD_COMP_IND: 'No' }
    ];
    Utils.joinRowsAndColumns.mockReturnValue(mockData);

    render(
      <Router>
        <AppLevelRetnRem />
      </Router>
    );

    await waitFor(() => expect(Utils.joinRowsAndColumns).toHaveBeenCalled());

    fireEvent.click(screen.getByLabelText('Legal Hold Filter'));
    expect(screen.getByLabelText('Legal Hold Filter')).toBeChecked();
    expect(screen.getByText('Total Applications')).toHaveTextContent('1');
  });

  test('exports data to Excel', async () => {
    const mockData = [
      { APPL_SYS_ID: '1', TYPE_CD: 'A', LGL_HLD_STS: 'YES', APPROVED_EXTENDED_RETENTION: 'Yes', APPL_LVL_CLS_CD_COMP_IND: 'Yes', CRE_TS: '2022-01-01T00:00:00Z' }
    ];
    Utils.joinRowsAndColumns.mockReturnValue(mockData);

    render(
      <Router>
        <AppLevelRetnRem />
      </Router>
    );

    await waitFor(() => expect(Utils.joinRowsAndColumns).toHaveBeenCalled());

    fireEvent.click(screen.getByText('Excel'));
    expect(XLSX.utils.book_new).toHaveBeenCalled();
    expect(XLSX.writeFile).toHaveBeenCalled();
  });

  test('exports data to PDF', async () => {
    const mockData = [
      { APPL_SYS_ID: '1', TYPE_CD: 'A', LGL_HLD_STS: 'YES', APPROVED_EXTENDED_RETENTION: 'Yes', APPL_LVL_CLS_CD_COMP_IND: 'Yes', CRE_TS: '2022-01-01T00:00:00Z' }
    ];
    Utils.joinRowsAndColumns.mockReturnValue(mockData);

    render(
      <Router>
        <AppLevelRetnRem />
      </Router>
    );

    await waitFor(() => expect(Utils.joinRowsAndColumns).toHaveBeenCalled());

    fireEvent.click(screen.getByText('PDF'));
    expect(jsPDF).toHaveBeenCalled();
  });

  test('handles row click to navigate', async () => {
    const mockData = [
      { APPL_SYS_ID: '1', TYPE_CD: 'A', LGL_HLD_STS: 'YES', APPROVED_EXTENDED_RETENTION: 'Yes', APPL_LVL_CLS_CD_COMP_IND: 'Yes' }
    ];
    Utils.joinRowsAndColumns.mockReturnValue(mockData);

    render(
      <Router>
        <AppLevelRetnRem />
      </Router>
    );

    await waitFor(() => expect(Utils.joinRowsAndColumns).toHaveBeenCalled());

    const rows = screen.getAllByRole('row');
    fireEvent.click(rows[1]);
    expect(global.fetch).toHaveBeenCalled();
  });

  test('handles API errors gracefully', async () => {
    global.fetch.mockImplementationOnce(() => Promise.reject('API is down'));
    render(
      <Router>
        <AppLevelRetnRem />
      </Router>
    );

    await waitFor(() => expect(screen.queryByTestId('app-levl-retn-rem-mds-progress-spinner')).not.toBeInTheDocument());
    expect(screen.queryByTestId('app-level-retn-rem-dashboard-title-text')).toBeInTheDocument();
  });

  test('renders empty state correctly', async () => {
    global.fetch.mockImplementationOnce(() => Promise.resolve({ json: () => Promise.resolve([]) }));
    render(
      <Router>
        <AppLevelRetnRem />
      </Router>
    );

    await waitFor(() => expect(Utils.joinRowsAndColumns).toHaveBeenCalled());
    expect(screen.getByText('No Data Found')).toBeInTheDocument();
  });

  test('toggles Legal Hold Filter', async () => {
    const mockData = [
      { APPL_SYS_ID: '1', TYPE_CD: 'A', LGL_HLD_STS: 'YES', APPROVED_EXTENDED_RETENTION: 'Yes', APPL_LVL_CLS_CD_COMP_IND: 'Yes' }
    ];
    Utils.joinRowsAndColumns.mockReturnValue(mockData);

    render(
      <Router>
        <AppLevelRetnRem />
      </Router>
    );

    await waitFor(() => expect(Utils.joinRowsAndColumns).toHaveBeenCalled());

    fireEvent.click(screen.getByLabelText('Legal Hold Filter'));
    expect(screen.getByLabelText('Legal Hold Filter')).toBeChecked();
    expect(screen.getByText('Total Applications')).toHaveTextContent('1');

    fireEvent.click(screen.getByLabelText('Legal Hold Filter'));
    expect(screen.getByLabelText('Legal Hold Filter')).not.toBeChecked();
    expect(screen.getByText('Total Applications')).toHaveTextContent('1');
  });

  test('matches snapshot', () => {
    const { asFragment } = render(
      <Router>
        <AppLevelRetnRem />
      </Router>
    );
    expect(asFragment()).toMatchSnapshot();
  });
});

  
