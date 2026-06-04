from pydantic import BaseModel


class MakeRead(BaseModel):
    id: int
    name: str
    is_active: bool = True
    model_count: int = 0
    generation_count: int = 0


class ModelRead(BaseModel):
    id: int
    make_id: int
    name: str


class ModelYearRead(BaseModel):
    id: int
    model_id: int
    year_start: int
    year_end: int
    generation: str | None
