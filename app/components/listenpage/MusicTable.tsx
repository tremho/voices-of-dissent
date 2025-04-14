import React, {useState, useRef, useMemo, useEffect} from "react";
import {
    Avatar, Checkbox,
    InputAdornment,
    Paper,
    Table, TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TableSortLabel,
    TextField,
    Typography
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import MusicNoteIcon from "@mui/icons-material/MusicNote"
import ServiceEndpoint from "../../../commonLib/ServiceEndpoint";

export const MusicTable = (props) => {
    const data = props?.data
    const reportBack = props.reportBack
    const identity = props.identity

    const setSelectedData = props.setSelectedData
    const [orderBy, setOrderBy] = useState(null);
    const [order, setOrder] = useState(null);
    const [search, setSearch] = useState({ artist: "", title: "", description: "" });
    const [selectedRow, setSelectedRow] = useState(null);
    const [skippedIds, setSkippedIds] = useState([])
    const [fetchedSkip, setFetchedSkip] = useState(false)
    const [ref, setSongRef] = useState(props.ref)

    // console.log("-------------REF---------")
    // console.log(ref)
    // console.log("-------------------------")

    const containerRef = useRef(null);
    const itemRefs = useRef({});

    useEffect(() => {
        if (selectedRow && itemRefs.current[selectedRow] && containerRef.current) {
            const container = containerRef.current;
            const selectedElement = itemRefs.current[selectedRow];

            const rowTop = selectedElement.offsetTop;
            const rowBottom = rowTop + selectedElement.offsetHeight;

            const containerTop = container.scrollTop;
            const containerBottom = containerTop + container.clientHeight;

            if (rowTop < containerTop) container.scrollTop = rowTop;
            else if (rowBottom > containerBottom) container.scrollTop = rowBottom - container.clientHeight;
        }
        if(!fetchedSkip) {
            updateIdentitySkips([], true)
            setFetchedSkip(true)
        }
    }, [selectedRow]);


    let killTimer:any
    async function updateIdentitySkips(skipArray = skippedIds, noBody = false, ) {
        // console.warn('------updateIdentitySkips-------', skipArray)
        if(killTimer || !identity) return
        killTimer = setTimeout(async () => {
            let skipPath = '/skips/'
            if(identity) skipPath += identity
            else skipPath += 'undefined'
            const skipsUrl = ServiceEndpoint(skipPath)
            const sids = Array.isArray(skipArray) ? skipArray : []
            const body = {skippedIds: sids}
            console.log("fetching skips ", skipsUrl)
            if(!noBody) console.log("skipped body ", body)
            const resp = await fetch(skipsUrl, {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: noBody ? undefined : JSON.stringify(body)
            })
            // console.log("updateIdentitySkips - ", {body, noBody, sids, skippedIds})
            const skresptext:string = await resp.text()
            console.log("skips response text", {skresptext})
            let skresp:any = {}
            try {
                skresp = JSON.parse(skresptext)
            } catch(e:any) {
                console.error("Parse error reading skip response ", skresptext)
            }
            const skipped = skresp?.skipped ?? []
            // console.warn("Skipped returned from updateIdentitySkips", skipped)
            setSkippedIds(skipped)
            killTimer = null
            // console.warn('---------------------------------')
        }, 500);
    }


    const filteredData = useMemo(() => {
        // console.log("DATA before filtering:", data);
        // console.log("Current search:", search);

        if (!Array.isArray(data) || data.length === 0) return [];

        const result = data.filter((row) =>
            Object.keys(search).every((key) => {
                const searchValue = search[key]?.trim().toLowerCase(); // Normalize input
                const rowValue = row[key]?.toString().toLowerCase(); // Ensure string comparison

                return !searchValue || (rowValue && rowValue.includes(searchValue)); // Fix: Prevent false negatives
            })
        );

        // console.log("Filtered Data:", result);
        return result;
    }, [data, search]);

    const sortedData = useMemo(() => {
        if (!orderBy || filteredData.length === 0) return filteredData;

        return [...filteredData].sort((a, b) => {
            const valA = a[orderBy]?.toString().toLowerCase() || "";
            const valB = b[orderBy]?.toString().toLowerCase() || "";

            if (valA < valB) return order === "asc" ? -1 : 1;
            if (valA > valB) return order === "asc" ? 1 : -1;
            return 0;
        });
    }, [filteredData, orderBy, order]);

    function advanceToNextRow(add=0) {
        let currentIndex = sortedData.findIndex(row => row.id === selectedRow);
        currentIndex += add
        let nextRow = sortedData[(currentIndex + 1) % sortedData.length];
        setSelectedRow(nextRow.id);
        setSelectedData(nextRow);
        if(isSkipped(nextRow)) {
            advanceToNextRow(++add)
            return
        }
        setTimeout(() => {
            document.getElementById('vod-audio-player')?.play().catch((e:any) => {
                console.error(`error in playback for index ${currentIndex}`, e)
                advanceToNextRow(++add)
            })
        }, 1000);
    }

    function isSkipped(row) {
        if(!identity) return false
        // console.log("skippedIds", skippedIds)
        const i = Array(...skippedIds).findIndex(id => id === row.id)
        const skip = i !== -1
        // console.log("check skip", row.id, i, skip)
        return skip
    }
    function toggleSkip(row) {
        if(!identity) return;
        // console.log("toggleSkip", row.id, {skippedIds});

        setSkippedIds((prevSkipped) => {
            const prev = Array(...prevSkipped).filter(id => typeof id === 'string')
            // console.log("setSkippedIds", prev)
            const newSkipped = prev.includes(row.id)
                ? prev.filter(id => id !== row.id) // Remove if already skipped
                : [...prev, row.id]; // Add if not skipped

            // console.log("Updated skippedIds", {newSkipped});
            setTimeout(() => updateIdentitySkips(newSkipped), 1000)
            return newSkipped; // Ensure React sees it as a new array
        });
    }

    if (reportBack) reportBack({ advanceToNextRow });

    const handleSort = (column) => {
        setOrderBy((prev) => (prev === column ? null : column));
        setOrder((prev) => (prev === "asc" ? "desc" : prev === "desc" ? null : "asc"));
    };

    const handleSearch = (column, value) => {
        setSearch((prev) => ({ ...prev, [column]: value.toLowerCase() }));
    };

    const handleRowClick = (e, id) => {
        const onSkip = e?.target?.nodeName === "INPUT"
        // console.log('handleRowClick', onSkip)
        if(onSkip) return;
        const selectedData = sortedData.find(row => row.id === id) || {};
        setSelectedRow(id);
        setSelectedData(selectedData);
        // console.log("row click data", {id, sortedData, selectedRow, selectedData})
    };

    if(ref && sortedData?.length) {
        // console.log(">>handling ref<<")
        const sr = ref
        setSongRef('')
        setTimeout(() => {
            handleRowClick(null, sr)
        },500)
    }

    // console.log(">>> ", {data, filteredData, sortedData})
    return (
        <div style={{ minHeight: 420, maxHeight: 420, overflowY: "scroll" }} ref={containerRef}>
            <Table stickyHeader>
                <TableHead>
                    <TableRow>
                        <TableCell>Cover</TableCell>
                        {["artist", "title", "description"].map((column) => (
                            <TableCell key={column}>
                                <TableSortLabel
                                    active={orderBy === column}
                                    direction={(order || "asc") as any}
                                    onClick={() => handleSort(column)}
                                >
                                    {column.charAt(0).toUpperCase() + column.slice(1)}
                                </TableSortLabel>
                                <TextField
                                    variant="outlined"
                                    size="small"
                                    onChange={(e) => handleSearch(column, e.target.value)}
                                    sx={{ "& .MuiOutlinedInput-notchedOutline": { border: "none" } }}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <SearchIcon fontSize="small" />
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            </TableCell>
                        ))}
                        <TableCell>Skip</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {sortedData.map((row) => (
                        <TableRow
                            key={row.id}
                            ref={(el) => (itemRefs.current[row.id] = el)}
                            onClick={(e) => handleRowClick(e, row.id)}
                            sx={{ backgroundColor: selectedRow === row.id ? "pink" : "inherit" }}
                        >
                            <TableCell>
                                <Avatar src={row.artUrl || undefined} variant="square">
                                    {!row.artUrl && <MusicNoteIcon />}
                                </Avatar>
                            </TableCell>
                            <TableCell>{row.artistName}</TableCell>
                            <TableCell>{row.title}</TableCell>
                            <TableCell>
                                <Typography
                                    sx={{
                                        display: '-webkit-box',
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: 'vertical',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                    }}
                                >
                                    {row.description}
                                </Typography>
                            </TableCell>
                            <TableCell><Checkbox checked={isSkipped(row)} onClick={() =>{toggleSkip(row)}} /></TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
};