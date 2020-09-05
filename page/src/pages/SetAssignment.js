import React, {useState, useEffect} from 'react';
import { Grid, Paper, TextField, Typography, Button } from '@material-ui/core';
import { PageInfo, TimePicker} from '../components';
import { useHistory } from "react-router-dom";
import axios from "axios";
import './pages.css';
import { modifiedDateToString } from '../shared/DateToString.js';

import SettingsIcon from '@material-ui/icons/Settings';
import AddCircleIcon from '@material-ui/icons/AddCircle';
import ClearIcon from '@material-ui/icons/Clear';
import Modal from '@material-ui/core/Modal';

function SetAssignment(props){
    const [update, forceUpdate] = useState(false); // rendering update용
    const [qOpen, setQOpen] = useState(false); // question modal 관리
    const [sOpen, setSOpen] = useState(false); // student list modal 관리
    const [assignId, setAssignId] = useState(-1);
    const [assignInfo, setAssignInfo] = useState("");
    const [lectureName, setLecture] = useState("");
    const [assignName, setAssignName] = useState("");
    const [publishingTime, setPublishingTime] = useState();
    const [deadline, setDeadline] = useState();
    const [modifiedDate, setModifiedDate] = useState();
    const [questions, setQuestions] = useState([]);
    const [students, setStudents] = useState([]);
    const [studentList, setStudentList] = useState({});
    // modal에 rendering되는 문제목록 관리
    const [renderQuestionIndex, setRenderQuestionIndex] = useState(-1); 
    const [renderQuestionName, setRenderQuestionName] = useState(""); 
    const [renderQuestionScore, setRenderQuestionScore] = useState(); 
    const [renderStudent, setRenderStudent] = useState([]); // modal에 rendering되는 학생목록 관리

    const history = useHistory();

    
    useEffect(()=>{
        // 처음 페이지를 불러올 때
        async function fetchData() {
            await getData();
        }

        fetchData();
    }, [props.match.params.asId]);

    useEffect(()=>{
        // students가 바뀔 때마다 renderStudent에 똑같이 저장
        let tmp = [];
        students.forEach((student)=>{ // 깊은 복사 (값 복사)
            tmp.push(student);
        })
        setRenderStudent(tmp);
    }, [students])


     // if you click question button => questionsHandleOpen();
     // if you click question +(add) button => addQuestion();
     // if you click question x(delete) button => deleteQuestion();
     // if you modify quetion modal textfield => changeRenderQuestion();
     // if you click quetions modal save button => saveRenderQuestion();

     // if you click studentList button => listHandleOpen();
     // if you click studentList modal get button => getStudentList();
     // if you click studentList modal list name button => getStudentList();


    const questionHandleOpen = (index) => {
        setQOpen(true);
        setRenderQuestionIndex(index);
        setRenderQuestionName(questions[index].questionContent);
        setRenderQuestionScore(questions[index].fullScore);
    };
    const questionHandleClose = () => {
        setQOpen(false);
    };

    const listHandleOpen = () => {
        setSOpen(true);
    };
    const listHandleClose = () => {
        setSOpen(false);
    };

        // function 

    function getData(){
        // 과제 정보 불러오기 api
        const asId = props.match.params.asId; // url의 과제id에 해당하는 정보 불러오기
        if(asId!==undefined && asId!=="add"){ // 이미 존재하는 과제 설정을 수정하는 페이지일 때
            axios
            .get(`/v1/assignment/${asId}`, { withCredentials: true })
            .then(res => {
                const data = res.data;
                setAssignId(data.assignmentId);
                setAssignInfo(data.assignmentInfo);
                let tmp = data.assignmentName.split('[');
                tmp = tmp[1].split(']');
                setLecture(tmp[0]);
                setAssignName(tmp[1]);
                setPublishingTime(data.publishingTime); 
                setDeadline(data.deadline);
                setQuestions(data.questions);
                setStudents(data.students);
            })
            .catch(err=>{
                if(err.response===undefined){
                    alert(`내부 함수 (SetAssignment.js => getData()) 문제입니다. 오류 수정 필요.`);
                }
                const status = err.response.status;
                if (status === 400) {
                    alert(`과제 정보를 얻는데 실패하였습니다. 잘못된 요청입니다. (${status})`);
                }
                else if (status === 401) {
                    alert(`과제 정보를 얻는데 실패하였습니다. 인증이 실패하였습니다. (${status})`);
                }
                else if (status === 404) {
                    return;
                }
                else if (status === 500) {
                    alert("내부 서버 오류입니다. 잠시 후에 다시 시도해주세요...");
                }
                //history.push("/home");
            });
        }else{ // 새로운 과제를 추가하는 페이지일 때
            setPublishingTime(new Date());
            setDeadline(new Date());
        }
    }
    
    async function addStudent(){
        // 학생 리스트 추가
        let tmp = renderStudent;
        tmp.push(undefined);
        await setRenderStudent(tmp);
        await forceUpdate(!update);
    }

    async function deleteStudent(index){
        // 학생 리스트 삭제
        let tmp = renderStudent;
        tmp.splice(index,1);
        await setRenderStudent(tmp);
        await forceUpdate(!update)
    }

    function changeStudentField(e, index){
        // textfield가 바뀔 때마다 renderStudent 갱신
        let tmp = renderStudent;
        let number = Number(e.target.value);
        if(number!==NaN){
            tmp[index] = number;
        }else{
            tmp[index] = undefined;
        }
        setRenderStudent(tmp);
    }

    function saveStudents(){
        // renderStudent => students 저장
        setStudents(renderStudent);
    }

    async function closePopUp(){
        // modal을 그냥 닫으면 listHandleClose만 적용되어 
        // student state에 저장 x, renderStudent state에만 저장 o
        // 저장 버튼을 눌러야 student state에 저장됨
        await saveStudents();
        await listHandleClose();
    }

    function preProcessingData(){
        // 빈 student textfield가 있으면 없애기
        let tmp = students;
        tmp.map((student, index)=>{
            if(student===undefined){
                tmp.splice(index,1);
            }
        });
        setStudents(tmp);
    }

    async function saveAssignmentToDB(){
        // 과제 수정/생성 API와의 연동

        await preProcessingData();
        await axios
        .post('/v1/assignment', {
            assignmentId : assignId,
            students : students,
            assignmentName: "["+lectureName+"]"+assignName,
            assignmentInfo: assignInfo,
            publishingTime: publishingTime,
            deadline: deadline,
            questions: questions
        } , { withCredentials: true })
        .catch(err=>{
            if(err.response===undefined){
                alert(`내부 함수 (SetAssignment.js => saveAssignmentToDB()) 문제입니다. 오류 수정 필요.`);
            }
            const status = err.response.status;
            if (status === 400) {
                alert(`과제 정보를 저장하는데 실패하였습니다. 잘못된 요청입니다. (${status})`);
            }
            else if (status === 401) {
                alert(`과제 정보를 저장하는데 실패하였습니다. 인증이 실패하였습니다. (${status})`);
            }
            else if (status === 403) {
                alert(`과제 정보를 저장하는데 실패하였습니다. 권한이 없습니다. (${status})`);
            }
            else if (status === 404) {
                alert(`과제 정보를 저장하는데 실패하였습니다. 과제를 찾을 수 없습니다. (${status})`);
            }
            else if (status === 500) {
                alert("내부 서버 오류입니다. 잠시 후에 다시 시도해주세요...");
            }
            history.push("/home/setting");
        });
        setModifiedDate(new Date()); 
    }

    function getStudentList(){
        // 수강생 목록 불러오기 api
        axios
        .get('/v1/student', { withCredentials: true })
        .then(res => {
            let tmp = {};
            res.data.map((list)=>{
                tmp[list.className]=list.students;
            })
            setStudentList(tmp);
        })
        .catch(err=>{
            if(err.response===undefined){
                alert(`내부 함수 (SetAssignment.js => getStudentList()) 문제입니다. 오류 수정 필요.`);
            }else{
                const status = err.response.status;
                if (status === 400) {
                    alert(`수강생 목록 정보를 얻는데 실패하였습니다. 잘못된 요청입니다. (${status})`);
                }
                else if (status === 401) {
                    alert(`수강생 목록 정보를 얻는데 실패하였습니다. 인증이 실패하였습니다. (${status})`);
                }
                else if (status === 403) {
                    alert(`수강생 목록 정보를 얻는데 실패하였습니다. 권한이 없습니다. (${status})`);
                }
                else if (status === 404) {
                    return;
                }
                else if (status === 500) {
                    alert("내부 서버 오류입니다. 잠시 후에 다시 시도해주세요...");
                }
            }
            history.push("/home");
        });
    }

    function renderStudentList(){
        // 수강생 목록 띄우기
        let result= [];
        for (const [name, list] of Object.entries(studentList)) {
            result.push(
                <Button onClick={()=>setStudents(list)}>{name}</Button>
            )
        };
        return result;
    }

    async function addQuestion(){
        // 새로운 문제 추가
        const index = questions.length;
        const newQuestion = {
            questionId : index,
            questionContent : "기본",
            fullScore : undefined,
        };

        let tmp = questions;
        tmp.push(newQuestion);
        await setQuestions(tmp);
        await questionHandleOpen(index);
    }

    async function changeRenderQuestion(e, type){
        // textfield가 바뀔 때마다 render state들 갱신

        if(type==0){ // 문제 설명 갱신
            await setRenderQuestionName(e.target.value);
        }else{ // 배점 갱신
            const number = Number(e.target.value);
            await setRenderQuestionScore(isNaN(number)?e.target.value:number);
        }
        await forceUpdate(!update);
    }

    async function deleteQuestion(index){
        // 문제 삭제
        let tmp = questions;
        tmp.splice(index,1);
        await forceUpdate(!update);
    }

    async function changeLectureField(e){
        // textfield가 바뀔 때마다 lectureName 갱신

        await setLecture(e.target.value);
        await forceUpdate(!update);
    }

    async function changeAssignNameField(e){
        // textfield가 바뀔 때마다 assignmentName 갱신

        await setAssignName(e.target.value);
        await forceUpdate(!update);
    }

    async function changeAssignInfoField(e){
        // textfield가 바뀔 때마다 Description 갱신

        await setAssignInfo(e.target.value);
        await forceUpdate(!update);
    }

    async function saveRenderQuestion(){
        if(isNaN(renderQuestionScore)){
            alert('배점에는 제대로 된 숫자를 입력해주세요.');
            return;
        }
        
        let tmp = questions;
        tmp[renderQuestionIndex].questionContent = renderQuestionName;
        tmp[renderQuestionIndex].fullScore = renderQuestionScore;

        await setQuestions(questions);
        await questionHandleClose();
    }
        // function 

    return(
        <Grid container spacing={6} direction="column">
            <Grid container item direction="row" alignItems="center">
                <Grid item xs={9}>
                    <PageInfo className="assignment_info"
                        icon={SettingsIcon}
                        mainTitle="과제별 설정"
                        subTitle="" />
                </Grid>
                <Grid item xs={3}>
                    <Typography>{modifiedDateToString(modifiedDate)}</Typography>
                    <Button className="save_button" onClick={saveAssignmentToDB}>저장</Button>
                </Grid>
            </Grid>
            <Grid container item spacing={4} direction="column" className="setting_as_con">
                <Grid container item direction="row">
                    <Grid xs={6}><TextField onChange={(e)=>changeLectureField(e)} InputLabelProps={{shrink:true}} label="강의명" required multiline rows={1} rowsMax={10000} value={lectureName}></TextField></Grid>
                    <Grid xs={6}><TextField onChange={(e)=>changeAssignNameField(e)} InputLabelProps={{shrink:true}} label="과제명" required multiline rows={1} rowsMax={10000} value={assignName}></TextField></Grid>
                </Grid>
                <Grid item>
                    {(publishingTime!==undefined && deadline!=undefined)?
                        <TimePicker
                            publishingTime = {publishingTime}
                            deadline = {deadline}
                            setPublishingTime = {setPublishingTime}
                            setDeadline = {setDeadline}
                        />
                        :"Please wait..."
                    }
                </Grid>
                <Grid container item direction="row">
                    <Grid xs={6}><TextField onChange={(e)=>changeAssignInfoField(e)} InputLabelProps={{shrink:true}} label="과제 설명" required multiline rows={1} rowsMax={10000} value={assignInfo}></TextField></Grid>
                </Grid>
                <Grid container item direction="row">
                    <Grid container spacing={1} xs={12}>
                        <Grid item>
                            <Typography variant="h6">문제</Typography>
                        </Grid>
                        <Grid container spacing={2} item direction="column">
                            {
                                questions.map((question, index)=>
                                    <Grid>
                                        <Button onClick={()=>questionHandleOpen(index)}>{index+1}.{question.questionContent}</Button>
                                        <Button onClick={()=>deleteQuestion(index)}><ClearIcon/></Button>
                                    </Grid>
                                )
                            }
                            <Modal
                                open={qOpen}
                                onClose={questionHandleClose}
                                aria-labelledby="add question to assignment"
                                aria-describedby="add question to assignment"
                                className="modal">
                                <Paper className="modal_con">
                                    <Grid container spacing={2} wrap="wrap" className="modal_form">
                                        <TextField onChange={(e)=>changeRenderQuestion(e,0)} InputLabelProps={{shrink:true}} label="문제 설명" required multiline rows={1} rowsMax={10000} value={renderQuestionName}></TextField>
                                        <TextField 
                                            onChange={(e)=>changeRenderQuestion(e,1)} 
                                            InputLabelProps={{shrink:true}} 
                                            label="배점" required multiline 
                                            rows={1} rowsMax={10} 
                                            value={renderQuestionScore}
                                            error={typeof(renderQuestionScore)==="string"?true:false}
                                            helperText="숫자를 입력해주세요."
                                            >
                                        </TextField>
                                    </Grid>
                                    <Button className="save_button" onClick={()=>saveRenderQuestion()}>저장</Button>
                                </Paper>
                            </Modal>
                            <AddCircleIcon className="add_button" fontSize="large" onClick={addQuestion}></AddCircleIcon>
                        </Grid>
                    </Grid>
                </Grid>
                
                <Grid container item direction="column">
                    <Grid><Button onClick={listHandleOpen}>수강생 목록</Button></Grid>
                    <Grid>
                        <Modal
                            open={sOpen}
                            onClose={listHandleClose}
                            aria-labelledby="add student list to assignment"
                            aria-describedby="add student list to assignment"
                            className="modal">
                            <Paper className="modal_con">
                                <Grid container spacing={2} wrap="wrap" className="modal_form">
                                    <Grid container item  xs={12}>
                                        <Button onClick={getStudentList}>수강생 목록 불러오기</Button>
                                        {renderStudentList()}
                                        <Button className="save_button" onClick={closePopUp}>저장</Button>
                                    </Grid>
                                    {
                                        renderStudent.map((student, index)=>
                                            <Grid container item xs={4} wrap="nowrap" alignItems="center">
                                                <TextField onChange={(e)=>changeStudentField(e, index)} className="popup_student" InputLabelProps={{shrink:true}} label={"학생"+(index+1)} required multiline rows={1} rowsMax={15} value={student}></TextField>
                                                <Button onClick={()=>deleteStudent(index)}><ClearIcon/></Button>
                                            </Grid>
                                        )
                                    }
                                    <AddCircleIcon className="add_button" fontSize="large" onClick={addStudent}></AddCircleIcon>
                                </Grid>
                            </Paper>
                        </Modal>
                    </Grid>
                </Grid>
            </Grid>
        </Grid>
    );
}

export default SetAssignment;